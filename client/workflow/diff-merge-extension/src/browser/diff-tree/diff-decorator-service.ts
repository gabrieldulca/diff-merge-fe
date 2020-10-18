import { Emitter, Event, MaybePromise } from "@theia/core";
import { Tree } from "@theia/core/lib/browser";
import { AbstractTreeDecoratorService, TreeDecorator } from "@theia/core/lib/browser/tree/tree-decorator";
import { WidgetDecoration } from "@theia/core/lib/browser/widget-decoration";
import { inject, injectable } from "inversify";

import { DiffTreeNode } from "./diff-tree-node";

/**
 * Symbol for all decorators that would like to contribute into the diff.
 */
// export const DiffTreeDecorator = Symbol('DiffTreeDecorator');
@injectable()
export class DiffTreeDecorator implements TreeDecorator {

    id: string;

    protected readonly emitter: Emitter<(tree: Tree) => Map<string, WidgetDecoration.Data>> = new Emitter();


    get onDidChangeDecorations(): Event<(tree: Tree) => Map<string, WidgetDecoration.Data>> {
        return this.emitter.event;
    }

    decorations(tree: Tree): MaybePromise<Map<string, WidgetDecoration.Data>> {
        const result = new Map();
        console.log("decorating tree", tree);
        if (tree.root) {
            if ((tree.root as DiffTreeNode).children.length === 3) {
                const additions: DiffTreeNode = (tree.root as DiffTreeNode).children[0] as DiffTreeNode;
                if (additions.children) {
                    for (const child of additions.children) {
                        result.set(child.id, { fontData: { color: "darkgreen" } });
                    }
                }
                const deletions: DiffTreeNode = (tree.root as DiffTreeNode).children[1] as DiffTreeNode;
                if (deletions.children) {
                    for (const child of deletions.children) {
                        result.set(child.id, { fontData: { color: "darkred" } });
                    }
                }
                const changes: DiffTreeNode = (tree.root as DiffTreeNode).children[2] as DiffTreeNode;
                if (changes.children) {
                    for (const child of changes.children) {
                        result.set(child.id, { fontData: { color: "yellow" } });
                    }
                }
            }
        }
        return result;
    }

}



/**
 * Decorator service for the diffs.
 */
@injectable()
export class DiffDecoratorService extends AbstractTreeDecoratorService {

    constructor(@inject(DiffTreeDecorator) protected readonly diffTreeDecorator: DiffTreeDecorator) {
        super([diffTreeDecorator]);
    }

}
