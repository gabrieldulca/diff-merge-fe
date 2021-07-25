import { CompositeTreeNode, SelectableTreeNode } from "@theia/core/lib/browser";
import {ExpandableTreeNode} from "@theia/core/src/browser/tree/tree-expansion";

/**
 * The custom diff tree node.
 */
export interface DiffTreeNode extends SelectableTreeNode, CompositeTreeNode, ExpandableTreeNode {

    id: string;
    changeType?: string | undefined;
    elementType?: string | undefined;
    source?: string | undefined;
    target?: string | undefined;
    icon?: string | undefined;
    modelElementId: string;
    diffSource?: string | undefined;

}
