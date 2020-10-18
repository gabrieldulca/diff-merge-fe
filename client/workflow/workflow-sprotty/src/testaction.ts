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
import {
    Action,
    CommandExecutionContext,
    CommandReturn,
    FeedbackCommand,
    GLSPGraph,
    SEdge,
    TYPES
} from "@eclipse-glsp/client";
import { inject, injectable } from "inversify";

import { ChangedElem, ComparisonDto, DiffTreeNode, MatchDto } from "./diffmerge";
import { TaskNode } from "./model";

@injectable()
export class ApplyDiffAction implements Action {
    public widgetId: string;
    public requestId: string | undefined;
    public comparison: ComparisonDto;
    public additionsTree: DiffTreeNode[];
    public changesTree: DiffTreeNode[];
    public deletionsTree: DiffTreeNode[];

    constructor(comparison: ComparisonDto, widgetId: string, requestId?: string) {
        this.widgetId = widgetId.replace("widget", "");
        this.requestId = requestId;
        this.comparison = comparison;
        this.additionsTree = [];
        this.changesTree = [];
        this.deletionsTree = [];
    }
    readonly kind = ApplyDiffCommand.KIND;

}

export class ApplyDiffCommand extends FeedbackCommand {
    static readonly KIND = "applyDiff";

    private changedElems: Map<string, ChangedElem>;

    constructor(@inject(TYPES.Action) public readonly action: ApplyDiffAction) { super(); }
    execute(context: CommandExecutionContext): CommandReturn {
        this.changedElems = new Map();
        console.log("Applying diff command: context", context);
        console.log("Applying diff command: comparison", this.action.comparison);

        const additions: string[] = this.getAdditions(context, this.action.comparison);
        console.log("Applying diff command: additions for " + this.action.widgetId, additions);
        const deletions: string[] = this.getDeletions(context, this.action.comparison);
        console.log("Applying diff command: deletions", deletions);
        const changes: string[] = this.getChanges(context, this.action.comparison);
        console.log("Applying diff command: changes", changes);
        console.log("Applying diff command: all diffs", this.changedElems);

        this.markAdditions(context, additions);
        this.getAdditionsTree(context, additions);

        this.markDeletions(context, deletions);
        this.getDeletionsTree(context, deletions);

        this.markChanges(context, changes);
        this.getChangesTree(context, changes);

        return context.root;
    }

    markDeletions(context: CommandExecutionContext, deletions: string[]): void {
        for (const del of deletions) {
            const oldElem = context.root.index.getById(del);
            if (oldElem && oldElem instanceof TaskNode) {
                const child = document.getElementById(this.action.widgetId + oldElem!.id);
                console.log("oldElemHtmlChild", child);
                console.log("oldElemHtmlChildId", document.getElementById(oldElem!.id));
                console.log("oldElemHtmlChildParentId", document.getElementById(oldElem!.parent.id));
                if (child) {
                    const rect = child.childNodes[0] as HTMLElement;
                    if (rect!.classList) {
                        rect!.classList.add("newly-deleted-node");
                    }
                }
            } else if (oldElem && oldElem instanceof SEdge) {
                if (oldElem.cssClasses) {
                    oldElem.cssClasses.concat(["newly-deleted-edge"]);
                    const child = document.getElementById(this.action.widgetId + oldElem!.id);
                    if (child) {
                        const arrow = child!.childNodes[1] as HTMLElement;
                        if (arrow!.classList) {
                            arrow!.classList.add("newly-deleted-arrow");
                        }
                    }
                } else {
                    oldElem.cssClasses = ["newly-deleted-edge"];
                    const child = document.getElementById(this.action.widgetId + oldElem!.id);
                    console.log("child", child);
                    if (child) {
                        const arrow = child!.childNodes[1] as HTMLElement;
                        if (arrow!.classList) {
                            arrow!.classList.add("newly-deleted-arrow");
                        }
                    }
                }
            }
        }
    }

    markAdditions(context: CommandExecutionContext, additions: string[]): void {
        for (const add of additions) {
            const newElem = context.root.index.getById(add);
            if (newElem && newElem instanceof TaskNode) {
                const child = document.getElementById(this.action.widgetId + newElem!.id);

                if (child) {
                    const rect = child.childNodes[0] as HTMLElement;

                    if (rect!.classList) {
                        rect!.classList.add("newly-added-node");
                    }
                }
            } else if (newElem && newElem instanceof SEdge) {
                if (newElem.cssClasses) {
                    newElem.cssClasses.concat(["newly-added-edge"]);
                    const child = document.getElementById(this.action.widgetId + newElem!.id);
                    if (child) {
                        const arrow = child!.childNodes[1] as HTMLElement;
                        if (arrow!.classList) {
                            arrow!.classList.add("newly-added-arrow");
                        }
                    }
                } else {
                    newElem.cssClasses = ["newly-added-edge"];
                    const child = document.getElementById(this.action.widgetId + newElem!.id);
                    if (child) {
                        const arrow = child!.childNodes[1] as HTMLElement;
                        if (arrow!.classList) {
                            arrow!.classList.add("newly-added-arrow");
                        }
                    }
                }
            }
        }
    }

    markChanges(context: CommandExecutionContext, changes: string[]): void {
        for (const change of changes) {
            const changedElem = context.root.index.getById(change);
            if (changedElem && changedElem instanceof TaskNode) {
                const child = document.getElementById(this.action.widgetId + changedElem!.id);
                if (child) {
                    const rect = child.childNodes[0] as HTMLElement;

                    if (rect!.classList) {
                        rect!.classList.add("newly-changed-node");
                    }
                }
                /*const child2 = document.getElementById(this.action.widgetId + changedElem!.id);
                if (child2) {
                    const rect = child2.childNodes[0] as HTMLElement;

                    if (rect!.classList) {
                        rect!.classList.add("newly-changed-node");
                    }
                }*/
            } else if (changedElem && changedElem instanceof SEdge) {
                const child = document.getElementById(this.action.widgetId + changedElem!.id);
                if (child) {
                    const arrow = child!.childNodes[1] as HTMLElement;
                    // const child2 = document.getElementById(this.action.widgetId + changedElem!.id);
                    // const arrow2 = child2!.childNodes[1] as HTMLElement;
                    if (changedElem.cssClasses) {
                        changedElem.cssClasses.concat(["newly-changed-edge"]);
                    } else {
                        changedElem.cssClasses = ["newly-changed-edge"];
                    }
                    if (arrow!.classList) {
                        arrow!.classList.add("newly-changed-arrow");
                    }
                    /*if (arrow2!.classList) {
                        arrow2!.classList.add("newly-changed-arrow");
                    }*/
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
                node.name = "[TaskNode] " + this.changedElems.get(add)!.name;
            } else if (newElem && newElem instanceof SEdge) {
                node.name = "[SEdge] " + this.changedElems.get(add)!.name;
            } else {
                node.name = "[ElemType] " + this.changedElems.get(add)!.name;
            }
            this.action.additionsTree.push(node);
        }
    }

    getDeletionsTree(context: CommandExecutionContext, deletions: string[]): void {
        for (const del of deletions) {
            const node: DiffTreeNode = new DiffTreeNode();
            node.id = del;
            const oldElem = context.root.index.getById(del);
            if (oldElem && oldElem instanceof TaskNode) {
                node.name = "[TaskNode] " + this.changedElems.get(del)!.name;
            } else if (oldElem && oldElem instanceof SEdge) {
                node.name = "[SEdge] " + this.changedElems.get(del)!.name;
            } else {
                node.name = "[ElemType] " + this.changedElems.get(del)!.name;
            }
            this.action.deletionsTree.push(node);
        }
    }

    getChangesTree(context: CommandExecutionContext, changes: string[]): void {
        for (const change of changes) {
            const node: DiffTreeNode = new DiffTreeNode();
            node.id = change;
            const changedElem = context.root.index.getById(change);
            if (changedElem && changedElem instanceof TaskNode) {
                node.name = "[TaskNode] " + this.changedElems.get(change)!.name;
            } else if (changedElem && changedElem instanceof SEdge) {
                node.name = "[SEdge] " + this.changedElems.get(change)!.name;
            } else if (changedElem && changedElem instanceof GLSPGraph) {
                node.name = "[GLSPGraph] " + this.changedElems.get(change)!.name;
            } else {
                node.name = "[ElemType] " + change;
            }
            this.action.changesTree.push(node);
        }
    }

    getDeletions(context: CommandExecutionContext, comparison: ComparisonDto): string[] {
        let deletions: string[] = [];
        if (comparison.matches != null) {
            for (const match of comparison.matches) {
                deletions = deletions.concat(this.getSubMatchDeletions(context, match, comparison.threeWay));
            }
        }
        return deletions;
    }

    getSubMatchDeletions(context: CommandExecutionContext, match: MatchDto, threeWay: boolean): string[] {
        let deletions: string[] = [];
        if (threeWay === false) {
            if ((match.right === null) && (match.left != null)) {
                deletions.push(match.left.id);
                let name: string = "";
                const modelElem = context.root.index.getById(match.left.id);
                if (modelElem && modelElem instanceof TaskNode) {
                    name = modelElem.editableLabel!.text;
                } else if (modelElem && modelElem instanceof SEdge) {
                    if (modelElem.source && modelElem.source instanceof TaskNode) {
                        name = modelElem.source.editableLabel!.text;
                    }
                    name = name + "->";
                    if (modelElem.target && modelElem.target instanceof TaskNode) {
                        name += modelElem.target.editableLabel!.text;
                    }
                }
                this.changedElems.set(match.left.id, new ChangedElem(match.left.id, name, "delete"));
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    deletions = deletions.concat(this.getSubMatchDeletions(context, subMatch, threeWay));
                }
            }
        } else {
            // TODO threeway :)
        }
        return deletions;
    }

    getAdditions(context: CommandExecutionContext, comparison: ComparisonDto): string[] {
        let additions: string[] = [];
        if (comparison.matches != null) {
            for (const match of comparison.matches) {
                additions = additions.concat(this.getSubMatchAdditions(context, match, comparison.threeWay));
            }
        }
        return additions;
    }

    getSubMatchAdditions(context: CommandExecutionContext, match: MatchDto, threeWay: boolean): string[] {
        let additions: string[] = [];
        if (threeWay === false) {
            if ((match.left === null) && (match.right != null)) {
                additions.push(match.right.id);
                let name: string = "";
                const modelElem = context.root.index.getById(match.right.id);
                if (modelElem && modelElem instanceof TaskNode) {
                    name = modelElem.editableLabel!.text;
                } else if (modelElem && modelElem instanceof SEdge) {
                    if (modelElem.source && modelElem.source instanceof TaskNode) {
                        name = modelElem.source.editableLabel!.text;
                    }
                    name = name + "->";
                    if (modelElem.target && modelElem.target instanceof TaskNode) {
                        name += modelElem.target.editableLabel!.text;
                    }
                }
                this.changedElems.set(match.right.id, new ChangedElem(match.right.id, name, "add"));
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    additions = additions.concat(this.getSubMatchAdditions(context, subMatch, threeWay));
                }
            }
        } else {
            // TODO threeway :)
        }
        return additions;
    }

    getChanges(context: CommandExecutionContext, comparison: ComparisonDto): string[] {
        let changes: string[] = [];
        if (comparison.matches != null) {
            for (const match of comparison.matches) {
                changes = changes.concat(this.getSubMatchChanges(context, match, comparison.threeWay));
            }
        }
        return changes;
    }

    getSubMatchChanges(context: CommandExecutionContext, match: MatchDto, threeWay: boolean): string[] {
        let changes: string[] = [];
        if (threeWay === false) {
            if ((match.left != null) && (match.right != null) && (match.diffs != null)) {
                if (match.diffs.length > 0) {
                    if (match.diffs[0].type.includes("CHANGE")) {
                        changes.push(match.right.id);
                        let name: string = "";
                        const modelElem = context.root.index.getById(match.right.id);
                        if (modelElem && modelElem instanceof GLSPGraph) {
                            name = "GLSP Model";
                        } else if (modelElem && modelElem instanceof TaskNode) {
                            name = modelElem.editableLabel!.text;
                        } else if (modelElem && modelElem instanceof SEdge) {
                            if (modelElem.source && modelElem.source instanceof TaskNode) {
                                name = modelElem.source.editableLabel!.text;
                            }
                            name = name + "->";
                            if (modelElem.target && modelElem.target instanceof TaskNode) {
                                name += modelElem.target.editableLabel!.text;
                            }
                        }
                        this.changedElems.set(match.right.id, new ChangedElem(match.right.id, name, "change"));
                    }
                }
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    changes = changes.concat(this.getSubMatchChanges(context, subMatch, threeWay));
                }
            }
        } else {
            // TODO threeway :)
        }
        return changes;
    }
}
