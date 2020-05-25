import {injectable, inject} from "inversify";
import {
    CommandContribution,
    CommandRegistry,
    MenuContribution,
    MenuModelRegistry,
    MessageService
} from "@theia/core/lib/common";
import {NavigatorContextMenu} from "@theia/navigator/lib/browser/navigator-contribution";
import { ComparisonService } from "../common";
import {NavigatorDiff} from "@theia/navigator/lib/browser/navigator-diff";
import {SelectionService, UriSelection} from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { EditorManager } from "@theia/editor/lib/browser";
import { DiffService } from '@theia/workspace/lib/browser/diff-service';
import {WorkflowGLSPClientContribution} from "@eclipse-glsp-examples/workflow-theia/lib/browser/language/workflow-glsp-client-contribution";
import {OpenerService} from "@theia/core/lib/browser/opener-service";
import {DiffUris} from "@theia/core/lib/browser";
import {DiffMergeExtensionManager} from "./diff-merge-extension-manager";


export const ComparisonExtensionCommand = {
    id: 'Comparison.command',
    label: "Compares two diagrams"
};
export const ComparisonSelectExtensionCommand = {
    id: 'ComparisonSelect.command',
    label: "Selects first diagram for comparison"
};

@injectable()
export class DiffMergeExtensionCommandContribution  extends WorkflowGLSPClientContribution implements CommandContribution {

    protected _firstComparisonFile: URI | undefined = undefined;
    protected get firstComparisonFile(): URI | undefined {
        return this._firstComparisonFile;
    }
    protected set firstComparisonFile(uri: URI | undefined) {
        this._firstComparisonFile = uri;
    }

    constructor(
        @inject(OpenerService) protected readonly openerService: OpenerService,
        @inject(EditorManager) protected readonly editorManager: EditorManager,
        @inject(DiffMergeExtensionManager) protected readonly diffMergeExtensionManager: DiffMergeExtensionManager,
        @inject(DiffService) protected readonly diffService: DiffService,
        @inject(MessageService) protected readonly messageService: MessageService,
        @inject(ComparisonService) protected readonly comparisonService: ComparisonService,
        @inject(NavigatorDiff) protected readonly navigatorDiff: NavigatorDiff,
        @inject(SelectionService) protected readonly selectionService: SelectionService,
) {
        super();
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ComparisonExtensionCommand, {
            execute: async () => {
                if(this.firstComparisonFile) {
                    console.log("first file", this.firstComparisonFile.path.toString());
                    let secondComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    console.log("second file", secondComparisonFile!.path.toString());
                    const comparison = await this.comparisonService.getComparisonResult(this.firstComparisonFile.path.toString(), secondComparisonFile!.path.toString());
                    console.log("comparison result", comparison);



                        //openView({ activate: false, reveal: true });

                    this.messageService.info(JSON.stringify(comparison));

                    if (secondComparisonFile) {
                        let diffUri:URI = DiffUris.encode(this.firstComparisonFile, secondComparisonFile);
                        this.diffMergeExtensionManager.open(diffUri);
                        //this.diffMergeExtensionManager.open(this.firstComparisonFile);
                        /*this.openerService.getOpener(diffUri).then(function (openHandler: OpenHandler) {
                            console.log("openHandler", openHandler);
                            console.log("openHandler", openHandler);
                            openHandler.open(diffUri);
                        });*/
                    }


                    //await this.workflowDiagramManager.getOrCreateByUri(new URI(this.firstComparisonFile.path.toString()));
                    //await this.workflowDiagramManager.getOrCreateByUri(new URI(secondComparisonFile!.path.toString()));

                    /*let _this = this;
                    let options:DiagramWidgetOptions = {uri: this.firstComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor"};
                    await this.workflowDiagramManager.createWidget(options).then(function (widget: DiagramWidget) { _this.workflowDiagramManager.doOpen(widget);});
                    let options2:DiagramWidgetOptions = {uri: secondComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor"};
                    let widgetOptions: WidgetOptions = {mode: 'split-right'};
                    let wop: WidgetOpenerOptions = {widgetOptions: widgetOptions};
                    await this.workflowDiagramManager.createWidget(options2).then(function (widget: DiagramWidget) {
                        _this.workflowDiagramManager.doOpen(widget,wop);
                        console.log("diagramConfigurationRegistry", widget.diContainer);
                        console.log("diagramConfigurationRegistry", widget.connector);
                    });*/


                } else {
                    this.messageService.info("Please select the first file for comparison");
                }
            }
        });

        registry.registerCommand(ComparisonSelectExtensionCommand, {
            execute: async () => {
                this.firstComparisonFile = UriSelection.getUri(this.selectionService.selection);
                console.log("file1",this.firstComparisonFile);
                this.messageService.info("Selected first file");

            }
        });
    }

    readonly fileExtensions: string[];
    readonly id: string;
    readonly name: string;
}

@injectable()
export class DiffMergeExtensionMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonExtensionCommand.id,
            label: 'EMF Compare with selected'
        });
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonSelectExtensionCommand.id,
            label: 'EMF Select for comparison'
        });
    }

}
