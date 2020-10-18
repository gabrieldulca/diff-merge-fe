import { Emitter } from "@theia/core";
import {
    CompositeTreeNode,
    ContextMenuRenderer,
    ExpandableTreeNode,
    NodeProps,
    SelectableTreeNode,
    TreeNode,
    TreeWidget
} from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import React = require("react");
import { CenterAction } from "sprotty";

import { DiffMergeDiagWidget } from "../diff-merge-diag-widget";
import { DiffTreeDecorator } from "./diff-decorator-service";
import { DiffLabelProvider } from "./diff-label-provider";
import { DiffTreeNode } from "./diff-tree-node";
import { DiffTreeProps } from "./diff-tree-props";
import { DiffViewTreeModel } from "./diff-view-tree";


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

export type DiffViewWidgetFactory = () => DiffViewWidget;
export const DiffViewWidgetFactory = Symbol('DiffViewWidgetFactory');

@injectable()
export class DiffViewWidget extends TreeWidget {

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

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();

    constructor(
        @inject(DiffLabelProvider) protected diffLabelProvider: DiffLabelProvider,
        @inject(DiffTreeDecorator) protected readonly decorator: DiffTreeDecorator,
        @inject(DiffTreeProps) protected readonly treeProps: DiffTreeProps,
        @inject(DiffViewTreeModel) model: DiffViewTreeModel,
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
        /*this.selectionService.onSelectionChanged(selection => {
            console.log("Selection changed ", selection);
        });*/
        console.log("Selectionservice", this.selectionService);
    }

    public setRoot() {
        this.model.root = {
            id: 'diff-tree-view-root',
            name: 'Model differences',
            visible: true,
            children: [],
            parent: undefined
        } as CompositeTreeNode;
        console.log("setting root node to", this.model.root);
    }

    /**
     * Handle the single-click mouse event.
     * @param node the tree node if available.
     * @param event the mouse single-click event.
     */
    protected handleClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
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
                    console.log("toggeling node", node);
                    event.currentTarget.setAttribute('data-node-id', node.id);
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

    /**
     * Actually toggle the tree node.
     * @param event the mouse click event.
     */
    protected doToggle(event: React.MouseEvent<HTMLElement>): void {
        const nodeId = event.currentTarget.getAttribute('data-node-id');
        console.log("clicked on nodeId", nodeId);
        if (nodeId) {
            const node: DiffTreeNode = this.model.getNode(nodeId) as DiffTreeNode;
            console.log("clicked on", node);
            if (node.changeType !== "add") {
                if (node.elementType !== "SEdge") {
                    this.baseWidget.glspActionDispatcher.dispatch(new CenterAction([nodeId]));
                } else {
                    this.baseWidget.glspActionDispatcher.dispatch(new CenterAction([node.source!, node.target!]));
                }
            }
            if (node.changeType !== "delete") {
                if (node.elementType !== "SEdge") {
                    this.firstWidget.glspActionDispatcher.dispatch(new CenterAction([nodeId]));
                } else {
                    this.firstWidget.glspActionDispatcher.dispatch(new CenterAction([node.source!, node.target!]));
                }
            }
            if (this.secondWidget) {
                if (node.elementType !== "SEdge") {
                    this.secondWidget.glspActionDispatcher.dispatch(new CenterAction([nodeId]));
                } else {
                    this.secondWidget.glspActionDispatcher.dispatch(new CenterAction([node.source!, node.target!]));
                }
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
        this.model.root = this.model.root = {
            id: 'diff-tree-view-differences',
            name: 'Model differences',
            visible: true,
            selected: false,
            changeType: "change",
            elementType: "root",
            children: [{
                id: 'diff-tree-view-additions',
                name: 'DIFF TREE Additions',
                visible: false,
                children: additions,
                changeType: "add",
                parent: undefined,
                selected: false
            } as DiffTreeNode,
            {
                id: 'diff-tree-view-deletions',
                name: 'DIFF TREE Deletions',
                visible: false,
                children: deletions,
                changeType: "delete",
                parent: undefined,
                selected: false
            } as DiffTreeNode,
            {
                id: 'diff-tree-view-changes',
                name: 'DIFF TREE Changes',
                visible: false,
                children: changes,
                changeType: "change",
                parent: undefined,
                selected: false
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
            return <div></div>;
        } else if (node.elementType === 'TaskNode') {
            classNameIcon = "fas fa-genderless";

        } else if (node.elementType === 'SEdge') {
            classNameIcon = "fas fa-arrows-alt-h";
        } else if (node.elementType === 'GLSPGraph') {
            classNameIcon = 'fas fa-project-diagram';
        }
        return <div style={{ width: "20px" }} className={classNameIcon}></div>;

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
