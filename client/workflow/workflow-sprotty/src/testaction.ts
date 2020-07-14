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

import { ComparisonDto, MatchDto } from "./diffmerge";
import { TaskNode } from "./model";

@injectable()
export class ApplyDiffAction implements Action {
    public requestId: string | undefined;
    public comparison: ComparisonDto;

    constructor(comparison: ComparisonDto, requestId?: string) {
        this.requestId = requestId;
        this.comparison = comparison;
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
        return context.root;
    }

    markDeletions(context: CommandExecutionContext, deletions: string[]): void {
        for (const del of deletions) {
            const oldElem = context.root.index.getById(del);
            if (oldElem && oldElem instanceof TaskNode) {
                console.log("oldElemCh",oldElem.children);
                console.log("oldElemCh",oldElem.parent);
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
