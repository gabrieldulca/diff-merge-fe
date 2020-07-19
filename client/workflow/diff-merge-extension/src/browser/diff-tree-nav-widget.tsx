import {
    AddCommandProperty,
    DetailFormWidget,
    MasterTreeWidget,
    NavigatableTreeEditorWidget,
    TreeEditor
} from "theia-tree-editor";
import {DefaultResourceProvider, ILogger, Resource} from "@theia/core";
import {NavigatableTreeEditorOptions} from "theia-tree-editor/lib/browser/navigatable-tree-editor-widget";
import { injectable, postConstruct, inject } from "inversify";
import { WorkspaceService } from "@theia/workspace/lib/browser";

@injectable()
export class DiffTreeNavWidget extends NavigatableTreeEditorWidget {protected resource: Resource;
    protected data: any;

    constructor(
        @inject(MasterTreeWidget) protected readonly treeWidget: MasterTreeWidget,
        @inject(DetailFormWidget) protected readonly formWidget: DetailFormWidget,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService,
        @inject(ILogger) protected readonly logger: ILogger,
        @inject(NavigatableTreeEditorOptions) protected readonly options: NavigatableTreeEditorOptions,
        @inject(DefaultResourceProvider) protected readonly provider: DefaultResourceProvider,
        @inject(TreeEditor.NodeFactory) protected readonly nodeFactory: TreeEditor.NodeFactory,
    ) {
        super(
            treeWidget,
            formWidget,
            workspaceService,
            logger,
            "DiffTreeWidget",
            options
        );
    }

    @postConstruct()
    protected init(): void {
        super.init();
        const uri = this.options.uri;
        this.provider.get(uri).then(
            resource => {
                this.resource = resource;
                this.load();
            },
            _ => console.error(`Could not create ressource for uri ${uri}`)
        );
    }

    /**
     * @return the property that contains data objects' type identifier.
     */
    protected getTypeProperty(): string {
        return "typeProp";
    }

    public save(): void {
        const content = JSON.stringify(this.data);
        this.resource.saveContents!(content).then(
            _ => this.setDirty(false),
            error => console.error(`Ressource ${this.uri} could not be saved.`, error)
        );
    }

    protected async load(): Promise<void> {
        let content = "";
        let error = false;
        try {
            content = await this.resource.readContents();
        } catch (e) {
            console.error(`Loading ${this.resource.uri} failed.`, e);
            error = true;
        }

        const json = JSON.parse(content);
        this.data = json;
        const treeData: TreeEditor.TreeData = {
            error,
            data: json,
        };
        this.treeWidget.setData(treeData);
    }

    protected deleteNode(node: Readonly<TreeEditor.Node>): void {
        if (node.parent && TreeEditor.Node.is(node.parent)) {
            const propertyData = node.parent.jsonforms.data[node.jsonforms.property];
            if (Array.isArray(propertyData)) {
                propertyData.splice(Number(node.jsonforms.index), 1);
            } else if (propertyData !== null && typeof propertyData === 'object') {
                if(node.jsonforms.index) {
                    propertyData[node.jsonforms.index] = undefined;
                }
            } else {
                this.logger.error(`Could not delete node's data from its parent's property ${node.jsonforms.property}. Property data:`, propertyData);
                return;
            }

            // Data was changed in place but need to trigger tree updates.
            this.treeWidget.updateDataForSubtree(node.parent, node.parent.jsonforms.data);
            this.setDirty(true);
        }
    }

    protected addNode({ node, type, property }: AddCommandProperty): void {
        // Create an empty object that only contains its type identifier
        const newData: { [k: string]: any } = {};
        newData[this.getTypeProperty()] = type;

        // TODO handle children not being stored in an array

        if (!node.jsonforms.data[property]) {
            node.jsonforms.data[property] = [];
        }
        node.jsonforms.data[property].push(newData);
        this.treeWidget.updateDataForSubtree(node, node.jsonforms.data);
        this.setDirty(true);
    }

    protected handleFormUpdate(data: any, node: TreeEditor.Node) {
        this.treeWidget.updateDataForSubtree(node, data);
        this.setDirty(true);
    }
}
