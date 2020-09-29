import { CompositeTreeNode, ExpandableTreeNode, TreeExpansionService, TreeModelImpl } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";

@injectable()
export class DiffViewTreeModel extends TreeModelImpl {

    @inject(TreeExpansionService) protected readonly expansionService: TreeExpansionService;

    /**
     * Handle the expansion of the tree node.
     * - The method is a no-op in order to preserve focus on the editor
     * after attempting to perform a `collapse-all`.
     * @param node the expandable tree node.
     */
    protected handleExpansion(node: Readonly<ExpandableTreeNode>): void {
        // no-op
    }

    async collapseAll(raw?: Readonly<CompositeTreeNode>): Promise<boolean> {
        const node = raw || this.selectedNodes[0];
        if (CompositeTreeNode.is(node)) {
            return this.expansionService.collapseAll(node);
        }
        return false;
    }
}
