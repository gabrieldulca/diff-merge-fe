import { CompositeTreeNode, SelectableTreeNode } from "@theia/core/lib/browser";

/**
 * The custom diff tree node.
 */
export interface DiffTreeNode extends SelectableTreeNode, CompositeTreeNode {

    changeType?: string | undefined;
    elementType?: string | undefined;
    source?: string | undefined;
    target?: string | undefined;
    icon?: string | undefined;
    modelElementId: string;
    diffSource?: string | undefined;

}
