import { GLSPClientContribution } from "@eclipse-glsp/theia-integration/lib/browser";
import {
    CommandRegistry,
    CommandService,
    ContributionProvider,
    Emitter,
    MenuModelRegistry,
    MessageService
} from "@theia/core";
import {
    CompositeTreeNode,
    ContextMenuRenderer,
    ExpandableTreeNode,
    NodeProps,
    SelectableTreeNode,
    TreeNode,
    TreeWidget
} from "@theia/core/lib/browser";
import { inject, injectable, named } from "inversify";
import React = require("react");
import { CenterAction, GetViewportAction, SetViewportAction } from "sprotty";

import { ComparisonService } from "../../common";
import { DiffMergeDiagWidget } from "../diff-merge-diag-widget";
import { MergeDiffMenuContribution } from "../merge-diff-menu/merge-diff-menu-contribution";
import { SplitPanelManager } from "../split-panel-manager";
import { DiffTreeDecorator } from "./diff-decorator-service";
import { DiffLabelProvider } from "./diff-label-provider";
import { DiffTreeNode } from "./diff-tree-node";
import { DiffTreeProps } from "./diff-tree-props";
import { DiffTreeModel } from "./diff-tree-model";


/**
 * Representation of an diff symbol information node.
 */
export interface DiffSymbolInformationNode extends CompositeTreeNode, SelectableTreeNode, ExpandableTreeNode {
    /**
     * The `iconClass` for the given tree node.
     */
    iconClass: string;
}

/**
 * Collection of outline symbol information node functions.
 */
export namespace DiffSymbolInformationNode {
    /**
     * Determine if the given tree node is an `DiffSymbolInformationNode`.
     * - The tree node is an `OutlineSymbolInformationNode` if:
     *  - The node exists.
     *  - The node is selectable.
     *  - The node contains a defined `iconClass` property.
     * @param node the tree node.
     *
     * @returns `true` if the given node is an `DiffSymbolInformationNode`.
     */
    export function is(node: TreeNode): node is DiffSymbolInformationNode {
        return !!node && SelectableTreeNode.is(node) && 'iconClass' in node;
    }
}

export type DiffViewWidgetFactory = () => DiffTreeWidget;
export const DiffViewWidgetFactory = Symbol('DiffViewWidgetFactory');


@injectable()
export class DiffTreeWidget extends TreeWidget {

    setDiagWidgets(baseWidget: DiffMergeDiagWidget, firstWidget: DiffMergeDiagWidget, secondWidget?: DiffMergeDiagWidget) {
        this.baseWidget = baseWidget;
        this.firstWidget = firstWidget;
        if (secondWidget) {
            this.secondWidget = secondWidget;
        }
    }
    private baseWidget: DiffMergeDiagWidget;
    private firstWidget: DiffMergeDiagWidget;
    private secondWidget: DiffMergeDiagWidget;
    private _additions: DiffTreeNode[];
    private _changes: DiffTreeNode[];
    private _deletions: DiffTreeNode[];

    get additions(): DiffTreeNode[] {
        return this._additions;
    }

    set additions(value: DiffTreeNode[]) {
        this._additions = value;
    }

    get changes(): DiffTreeNode[] {
        return this._changes;
    }

    set changes(value: DiffTreeNode[]) {
        this._changes = value;
    }

    get deletions(): DiffTreeNode[] {
        return this._deletions;
    }

    set deletions(value: DiffTreeNode[]) {
        this._deletions = value;
    }

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();

    constructor(
        @inject(MenuModelRegistry) protected menuModelRegistry: MenuModelRegistry,
        @inject(DiffLabelProvider) protected diffLabelProvider: DiffLabelProvider,
        @inject(DiffTreeDecorator) protected readonly decorator: DiffTreeDecorator,
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(DiffTreeProps) protected readonly treeProps: DiffTreeProps,
        @inject(DiffTreeModel) model: DiffTreeModel,
        @inject(ComparisonService) protected readonly comparisonService: ComparisonService,
        @inject(SplitPanelManager) protected readonly splitPanelManager: SplitPanelManager,
        @inject(CommandService) protected readonly commandService: CommandService,
        @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry,
        @inject(ContributionProvider) @named(GLSPClientContribution) protected readonly contributionProvider: ContributionProvider<GLSPClientContribution>,
        @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer
    ) {
        super(treeProps, model, contextMenuRenderer);

        this.id = 'diff-tree-view';
        this.title.label = 'DIFF TREE';
        this.title.caption = 'DIFF TREE';
        this.title.closable = true;
        this.title.iconClass = 'fa outline-view-tab-icon';
        this.addClass('theia-outline-view');
        this.treeProps.multiSelect = false;
        this.saveChanges = this.saveChanges.bind(this);
        this.revertChanges = this.revertChanges.bind(this);
        this.mergeNonConflicting = this.mergeNonConflicting.bind(this);
    }

    public setRoot() {
        this.model.root = {
            id: 'diff-tree-view-root',
            name: 'Model differences',
            visible: true,
            children: [],
            parent: undefined
        } as CompositeTreeNode;
    }

    /**
     * Handle the single-click mouse event.
     * @param node the tree node if available.
     * @param event the mouse single-click event.
     */
    protected handleClickEvent(node: DiffTreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        if (node) {

            if (!!this.props.multiSelect) {
                const shiftMask = this.hasShiftMask(event);
                const ctrlCmdMask = this.hasCtrlCmdMask(event);
                if (SelectableTreeNode.is(node)) {
                    if (shiftMask) {
                        this.model.selectRange(node);
                    } else if (ctrlCmdMask) {
                        this.model.toggleNode(node);
                    } else {
                        this.model.selectNode(node);
                    }
                }
                if (this.isExpandable(node) && !shiftMask && !ctrlCmdMask) {
                    this.model.toggleNodeExpansion(node);
                }
            } else {
                if (SelectableTreeNode.is(node)) {
                    event.currentTarget.setAttribute('data-node-id', node.id);
                    event.currentTarget.setAttribute('data-model-element-id', node.modelElementId);
                    this.toggle(event);
                    this.model.selectNode(node);
                }
                if (this.isExpandable(node) && !this.hasCtrlCmdMask(event) && !this.hasShiftMask(event)) {
                    this.model.toggleNodeExpansion(node);
                }
            }
            event.stopPropagation();
        }
    }

    /**
     * Toggle the node.
     */
    protected readonly toggle = (event: React.MouseEvent<HTMLElement>) => this.doToggle(event);

    protected handleContextMenuEvent(node: DiffTreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        if (SelectableTreeNode.is(node)) {
            this.model.selectNode(node);
            this.selectionService.selection = node;
            // Keep the selection for the context menu, if the widget support multi-selection and the right click happens on an already selected node.
            //TODO multiselect
            /*if (!this.props.multiSelect || !node.selected) {
                const type = !!this.props.multiSelect && this.hasCtrlCmdMask(event) ? TreeSelection.SelectionType.TOGGLE : TreeSelection.SelectionType.DEFAULT;
                this.model.addSelection({ node, type });
            }*/

            const { x, y } = event.nativeEvent;

            this.model.refresh();
            const contributions: GLSPClientContribution[] = this.contributionProvider.getContributions(false);
            for (const c of contributions) {
                if (c instanceof MergeDiffMenuContribution) {
                    const mergeMenu: MergeDiffMenuContribution = c;
                    if (!this.secondWidget) {
                        mergeMenu.setFiles(this, this.baseWidget.uri.path.toString(), this.firstWidget.uri.path.toString(), "");
                    } else {
                        mergeMenu.setFiles(this, this.baseWidget.uri.path.toString(), this.firstWidget.uri.path.toString(), this.secondWidget.uri.path.toString());
                    }
                }
            }

            this.contextMenuRenderer.render({ menuPath: ["menubar", "merge-diff"], anchor: { x: x, y: y } });

            this.doFocus();
        }
        event.stopPropagation();
        event.preventDefault();
    }
    /**
     * Actually toggle the tree node.
     * @param event the mouse click event.
     */
    protected doToggle(event: React.MouseEvent<HTMLElement>): void {
        const nodeId = event.currentTarget.getAttribute('data-node-id');
        const modelElementId = event.currentTarget.getAttribute('data-model-element-id');
        if (nodeId && modelElementId) {
            const node: DiffTreeNode = this.model.getNode(nodeId) as DiffTreeNode;
            if (node.changeType === "delete") {
                if (node.elementType !== "SEdge") {
                    this.baseWidget.glspActionDispatcher.dispatch(new CenterAction([modelElementId]));
                } else {
                    this.baseWidget.glspActionDispatcher.dispatch(new CenterAction([node.source!, node.target!]));
                }
            }
            if (node.changeType === "change") {
                if (node.elementType !== "SEdge") {
                    this.firstWidget.glspActionDispatcher.dispatch(new CenterAction([modelElementId]));
                } else {
                    this.firstWidget.glspActionDispatcher.dispatch(new CenterAction([node.source!, node.target!]));
                }
                if (node.elementType !== "SEdge") {
                    this.baseWidget.glspActionDispatcher.dispatch(new CenterAction([modelElementId]));
                } else {
                    this.baseWidget.glspActionDispatcher.dispatch(new CenterAction([node.source!, node.target!]));
                }
            }
            if (node.changeType === "add") {
                let centerAction: CenterAction;
                if (node.elementType === "SEdge") {
                    centerAction = new CenterAction([node.source!, node.target!]);
                } else {
                    centerAction = new CenterAction([modelElementId]);
                }
                // threeway comparison
                if (this.secondWidget) {
                    if (node.diffSource === "LEFT") {
                        this.firstWidget.glspActionDispatcher.dispatch(centerAction);
                        this.firstWidget.actionDispatcher.request(GetViewportAction.create()).then(result => {
                            this.secondWidget.actionDispatcher.dispatch(new SetViewportAction(
                                "sprotty", result.viewport, true)); //TODO change sprotty to model root
                            this.baseWidget.actionDispatcher.dispatch(new SetViewportAction(
                                "sprotty", result.viewport, true));
                        });
                    }
                    if (node.diffSource === "RIGHT") {
                        this.secondWidget.glspActionDispatcher.dispatch(centerAction);
                        this.secondWidget.actionDispatcher.request(GetViewportAction.create()).then(result => {
                            this.firstWidget.actionDispatcher.dispatch(new SetViewportAction(
                                "sprotty", result.viewport, true)); //TODO change sprotty to model root
                            this.baseWidget.actionDispatcher.dispatch(new SetViewportAction(
                                "sprotty", result.viewport, true));
                        });
                    }

                } else
                // No second widget is present (it's not a threeway comparison), so center the first one
                {
                    this.firstWidget.glspActionDispatcher.dispatch(centerAction).then(() =>
                        this.firstWidget.actionDispatcher.request(GetViewportAction.create()).then(result => {
                            this.baseWidget.actionDispatcher.dispatch(new SetViewportAction(
                                "sprotty", result.viewport, true));
                    }));

                }
            }
            if (node.changeType === "change" && this.secondWidget) {
                if (node.elementType !== "SEdge") {
                    this.secondWidget.glspActionDispatcher.dispatch(new CenterAction([modelElementId]));
                } else {
                    this.secondWidget.glspActionDispatcher.dispatch(new CenterAction([node.source!, node.target!]));
                }
            }
            if (node.changeType === "delete") {
                this.baseWidget.actionDispatcher.request(GetViewportAction.create()).then(result => {
                    this.firstWidget.actionDispatcher.dispatch(new SetViewportAction(
                        "sprotty", result.viewport, true));//TODO change sprotty to model root
                    if (this.secondWidget) {
                        this.secondWidget.actionDispatcher.dispatch(new SetViewportAction(
                            "sprotty", result.viewport, true));//TODO change sprotty to model root
                    }
                });
            }
        }
        event.stopPropagation();
    }

    /**
     * Update the global selection for the tree.
     */
    protected updateGlobalSelection(): void {
        console.log("selected nodes", this.model.selectedNodes);

        super.updateGlobalSelection();
        console.log("selected nodes", this.model.selectedNodes);
    }


    public setChanges(additions: DiffTreeNode[], deletions: DiffTreeNode[], changes: DiffTreeNode[]) {
        this.additions = additions;
        this.deletions = deletions;
        this.changes = changes;
        this.model.root = {
            id: 'diff-tree-view-differences',
            name: 'Model differences',
            visible: true,
            selected: false,
            changeType: "change",
            elementType: "root",
            modelElementId: "diff-tree-view-differences",
            expanded: true,
            children: [{
                id: 'diff-tree-view-additions',
                name: 'DIFF TREE Additions',
                modelElementId: 'diff-tree-view-additions',
                visible: false,
                children: additions,
                changeType: "add",
                parent: undefined,
                selected: false,
                expanded: true,
            } as DiffTreeNode,
            {
                id: 'diff-tree-view-deletions',
                name: 'DIFF TREE Deletions',
                visible: false,
                children: deletions,
                modelElementId: 'diff-tree-view-deletions',
                changeType: "delete",
                parent: undefined,
                selected: false,
                expanded: true,
            } as DiffTreeNode,
            {
                id: 'diff-tree-view-changes',
                modelElementId: 'diff-tree-view-changes',
                name: 'DIFF TREE Changes',
                visible: false,
                children: changes,
                changeType: "change",
                parent: undefined,
                selected: false,
                expanded: true,
            } as DiffTreeNode],
            parent: undefined
        } as DiffTreeNode;
    }

    /**
     * Render the tree node given the node properties.
     * @param node the tree node.
     * @param props the node properties.
     */
    protected renderIcon(node: DiffTreeNode, props: NodeProps): React.ReactNode {
        let classNameIcon = 'fas fa-question';

        if (node.elementType === 'root') {
            const buttonStyle = {
                color: "white",
                backgroundColor: "transparent",
                marginRight: "5px",
                borderRadius: "4px",
                borderColor: "white",
                border: "2px solid",
                fontFamily: "Arial"
            };
            return <div>
                <button type="button" style={buttonStyle} onClick={this.saveChanges}>Save</button>
                <button type="button" style={buttonStyle} onClick={this.revertChanges}>Cancel</button>
                <button type="button" style={buttonStyle} onClick={this.mergeNonConflicting}>Merge non-conflicting changes</button>
            </div>;
        } else if (node.elementType === 'TaskNode') {
            classNameIcon = "fas fa-genderless";

        } else if (node.elementType === 'SEdge') {
            classNameIcon = "fas fa-arrows-alt-h";
        } else if (node.elementType === 'GLSPGraph') {
            classNameIcon = 'fas fa-project-diagram';
        }
        return <div style={{ width: "20px" }} className={classNameIcon}></div>;

    }

    public async saveChanges() {
        const baseFilePath = this.baseWidget.uri.path.toString();
        const firstFilePath = this.firstWidget.uri.path.toString();
        await this.comparisonService.saveFiles(baseFilePath, firstFilePath).then((result) => {
            console.log("Invocation result: ", result);
        }, (reject) => {
            console.log("Rejected promise ", reject);
        });
        this.messageService.info("Applied changes have been saved!");
    }

    public async mergeNonConflicting() {
        const baseFilePath = this.baseWidget.uri.path.toString();
        const firstFilePath = this.firstWidget.uri.path.toString();

        if (this.secondWidget) {
            await this.comparisonService.getThreeWayMergeResult(firstFilePath, baseFilePath, this.secondWidget.uri.path.toString());
                /*.then((result) => {
                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                });*/
        } else {
            await this.comparisonService.getMergeResult(baseFilePath, firstFilePath);
                /*.then((result) => {
                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                });*/
        }
        this.messageService.info("File " + this.baseWidget.uri.path.base + " has been merged");
    }

    public async revertChanges() {
        const baseFilePath = this.baseWidget.uri.path.toString();
        const firstFilePath = this.firstWidget.uri.path.toString();

        if (this.secondWidget) {
            await this.comparisonService.revertFiles3w(firstFilePath, baseFilePath, this.secondWidget.uri.path.toString())
                .then((result) => {
                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                });
        } else {
            await this.comparisonService.revertFiles(baseFilePath, firstFilePath)
                .then((result) => {
                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                });
        }
        this.messageService.info("File " + this.baseWidget.uri.path.base + " has been reverted");
    }


    /**
     * Set the outline tree with the list of `DiffSymbolInformationNode`.
     * @param roots the list of `DiffSymbolInformationNode`.
     */
    public setOutlineTree(roots: DiffSymbolInformationNode[]): void {
        // Gather the list of available nodes.
        const nodes = this.reconcileTreeState(roots);
        // Update the model root node, appending the outline symbol information nodes as children.
        this.model.root = {
            id: 'diff-tree-view-root',
            name: 'DIFF TREE Root',
            visible: true,
            children: nodes,
            parent: undefined
        } as CompositeTreeNode;
    }

    /**
     * Reconcile the outline tree state, gathering all available nodes.
     * @param nodes the list of `TreeNode`.
     *
     * @returns the list of tree nodes.
     */
    protected reconcileTreeState(nodes: TreeNode[]): TreeNode[] {
        nodes.forEach(node => {
            if (DiffSymbolInformationNode.is(node)) {
                const treeNode = this.model.getNode(node.id);
                if (treeNode && DiffSymbolInformationNode.is(treeNode)) {
                    treeNode.expanded = node.expanded;
                    treeNode.selected = node.selected;
                }
                this.reconcileTreeState(Array.from(node.children));
            }
        });
        return nodes;
    }
}
