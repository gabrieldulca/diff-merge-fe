/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { Action, CommandExecutionContext, CommandReturn, FeedbackCommand, SEdge, TYPES } from "@eclipse-glsp/client";
import { inject, injectable } from "inversify";

import { ComparisonDto, DiffTreeNode, MatchDto } from "./diffmerge";
import { TaskNode } from "./model";

@injectable()
export class ApplyDiffAction implements Action {
    public requestId: string | undefined;
    public comparison: ComparisonDto;
    public additionsTree: DiffTreeNode[];
    public deletionsTree: DiffTreeNode[];

    constructor(comparison: ComparisonDto, requestId?: string) {
        this.requestId = requestId;
        this.comparison = comparison;
        this.additionsTree = [];
        this.deletionsTree = [];
    }
    readonly kind = ApplyDiffCommand.KIND;

}

export class ApplyDiffCommand extends FeedbackCommand {
    static readonly KIND = "applyDiff";

    constructor(@inject(TYPES.Action) public readonly action: ApplyDiffAction) { super(); }
    execute(context: CommandExecutionContext): CommandReturn {
        console.log("Applying diff command", context);
        console.log("on", this.action.comparison);

        const deletions: string[] = this.getDeletions(this.action.comparison);
        console.log("deletions", deletions);
        this.markDeletions(context, deletions);

        const additions: string[] = this.getAdditions(this.action.comparison);
        console.log("additions", additions);
        this.markAdditions(context, additions);
        this.getAdditionsTree(context, additions);
        this.getDeletionsTree(context, deletions);

        return context.root;
    }

    markDeletions(context: CommandExecutionContext, deletions: string[]): void {
        for (const del of deletions) {
            const oldElem = context.root.index.getById(del);
            if (oldElem && oldElem instanceof TaskNode) {
                console.log("oldElemCh", oldElem.children);
                console.log("oldElemCh", oldElem.parent);
                const child = document.getElementById("workflow-diagram_0_" + oldElem!.id);
                if (child) {
                    const rect = child.childNodes[0] as HTMLElement;
                    if (rect!.classList) {
                        rect!.classList.add("newly-deleted-node");
                    }
                }
            } else if (oldElem && oldElem instanceof SEdge) {
                if (oldElem.cssClasses) {
                    oldElem.cssClasses.concat(["newly-deleted-edge"]);
                    const child = document.getElementById("workflow-diagram_0_" + oldElem!.id);
                    const arrow = child!.childNodes[1] as HTMLElement;
                    if (arrow!.classList) {
                        arrow!.classList.add("newly-deleted-arrow");
                    }
                } else {
                    oldElem.cssClasses = ["newly-deleted-edge"];
                    const child = document.getElementById("workflow-diagram_0_" + oldElem!.id);
                    console.log("child", child);
                    const arrow = child!.childNodes[1] as HTMLElement;
                    if (arrow!.classList) {
                        arrow!.classList.add("newly-deleted-arrow");
                    }
                }
            }
        }
    }

    markAdditions(context: CommandExecutionContext, aditions: string[]): void {
        for (const add of aditions) {
            const newElem = context.root.index.getById(add);
            if (newElem && newElem instanceof TaskNode) {
                const child = document.getElementById("workflow-diagram_1_" + newElem!.id);

                if (child) {
                    const rect = child.childNodes[0] as HTMLElement;

                    if (rect!.classList) {
                        rect!.classList.add("newly-added-node");
                    }
                }
            } else if (newElem && newElem instanceof SEdge) {
                if (newElem.cssClasses) {
                    newElem.cssClasses.concat(["newly-added-edge"]);
                    const child = document.getElementById("workflow-diagram_1_" + newElem!.id);
                    const arrow = child!.childNodes[1] as HTMLElement;
                    if (arrow!.classList) {
                        arrow!.classList.add("newly-added-arrow");
                    }
                } else {
                    newElem.cssClasses = ["newly-added-edge"];
                    const child = document.getElementById("workflow-diagram_1_" + newElem!.id);
                    const arrow = child!.childNodes[1] as HTMLElement;
                    if (arrow!.classList) {
                        arrow!.classList.add("newly-added-arrow");
                    }
                }
            }
        }
    }

    getAdditionsTree(context: CommandExecutionContext, additions: string[]): void {
        for (const add of additions) {
            const node: DiffTreeNode = new DiffTreeNode();
            node.id = add;
            const newElem = context.root.index.getById(add);
            if (newElem && newElem instanceof TaskNode) {
                node.name = "[TaskNode] " + add;
            } else if (newElem && newElem instanceof SEdge) {
                node.name = "[SEdge] " + add;
            } else {
                node.name = "[ElemType] " + add;
            }
            this.action.additionsTree.push(node);
        }
    }

    getDeletionsTree(context: CommandExecutionContext, deletions: string[]): void {
        for (const del of deletions) {
            const node: DiffTreeNode = new DiffTreeNode();
            node.id = del;
            const newElem = context.root.index.getById(del);
            if (newElem && newElem instanceof TaskNode) {
                node.name = "[TaskNode] " + del;
            } else if (newElem && newElem instanceof SEdge) {
                node.name = "[SEdge] " + del;
            } else {
                node.name = "[ElemType] " + del;
            }
            this.action.deletionsTree.push(node);
        }
    }

    getDeletions(comparison: ComparisonDto): string[] {
        let deletions: string[] = [];
        if (comparison.matches != null) {
            for (const match of comparison.matches) {
                deletions = deletions.concat(this.getSubMatchDeletions(match, comparison.threeWay));
            }
        }
        return deletions;
    }

    getSubMatchDeletions(match: MatchDto, threeWay: boolean): string[] {
        let deletions: string[] = [];
        if (threeWay == false) {
            if ((match.right == null) && (match.left != null)) {
                deletions.push(match.left.id);
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    deletions = deletions.concat(this.getSubMatchDeletions(subMatch, threeWay));
                }
            }
        } else {
            // TODO threeway :)
        }
        return deletions;
    }

    getAdditions(comparison: ComparisonDto): string[] {
        let additions: string[] = [];
        if (comparison.matches != null) {
            for (const match of comparison.matches) {
                additions = additions.concat(this.getSubMatchAdditions(match, comparison.threeWay));
            }
        }
        return additions;
    }

    getSubMatchAdditions(match: MatchDto, threeWay: boolean): string[] {
        let additions: string[] = [];
        if (threeWay == false) {
            if ((match.left == null) && (match.right != null)) {
                additions.push(match.right.id);
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    additions = additions.concat(this.getSubMatchAdditions(subMatch, threeWay));
                }
            }
        } else {
            // TODO threeway :)
        }
        return additions;
    }
}
