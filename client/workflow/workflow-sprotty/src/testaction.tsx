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
    public widgetSide: string | undefined; // left, base or right


    constructor(comparison: ComparisonDto, widgetId: string, requestId?: string, widgetSide?: string) {
        this.widgetId = widgetId.replace("widget", "");
        this.requestId = requestId;
        this.comparison = comparison;
        this.additionsTree = [];
        this.changesTree = [];
        this.deletionsTree = [];
        this.widgetSide = widgetSide;
    }
    readonly kind = ApplyDiffCommand.KIND;

}

export class ApplyDiffCommand extends FeedbackCommand {
    static readonly KIND = "applyDiff";

    private changedElems: Map<string, ChangedElem>;

    constructor(@inject(TYPES.Action) public readonly action: ApplyDiffAction) { super(); }
    execute(context: CommandExecutionContext): CommandReturn {

        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!.querySelectorAll('.newly-added-node')).forEach((el) => el.classList.remove('newly-added-node'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!.querySelectorAll('.newly-added-edge')).forEach((el) => el.classList.remove('newly-added-edge'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!.querySelectorAll('.newly-added-arrow')).forEach((el) => el.classList.remove('newly-added-arrow'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!.querySelectorAll('.newly-deleted-node')).forEach((el) => el.classList.remove('newly-deleted-node'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!.querySelectorAll('.newly-deleted-edge')).forEach((el) => el.classList.remove('newly-deleted-edge'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!.querySelectorAll('.newly-changed-node')).forEach((el) => el.classList.remove('newly-changed-node'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!.querySelectorAll('.newly-changed-edge')).forEach((el) => el.classList.remove('newly-changed-edge'));


        this.changedElems = new Map();
        console.log("Applying diffAction ", this.action);
        console.log("Applying diff command: context", context);
        console.log("Applying diff command: comparison", this.action.comparison);

        const additions: string[] = this.getAdditions(context, this.action.comparison);
        console.log("Applying diff command: additions for " + this.action.widgetId, additions);
        const deletions: string[] = this.getDeletions(context, this.action.comparison);
        console.log("Applying diff command: deletions", deletions);
        const changes: string[] = this.getChanges(context, this.action.comparison);
        console.log("Applying diff command: changes", changes);
        console.log("Applying diff command: all diffs", this.changedElems);

        if (!(this.action.widgetSide === "base" && this.action.comparison.threeWay == true)) {
            this.markAdditions(context, additions);
        }
        this.getAdditionsTree(context, additions);

        if (this.action.comparison.threeWay == false) {//For threeway they are marked individually
            this.markDeletions(context, deletions);
        }
        this.getDeletionsTree(context, deletions);
        console.log("DELETIONS TREE FOR " + this.action.widgetId, this.action.deletionsTree);

        if (!(this.action.widgetSide === "base" && this.action.comparison.threeWay == true)) {
            this.markChanges(context, changes, this.action.widgetSide!);
        }
        this.getChangesTree(context, changes, this.action.widgetSide!);

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

    markThreewayDeletion(context: CommandExecutionContext, del: string, direction: string): void {
        const oldElem = context.root.index.getById(del);
        if (oldElem && oldElem instanceof TaskNode) {
            const child = document.getElementById(this.action.widgetId + oldElem!.id);
            console.log("oldElemHtmlChild", child);
            console.log("oldElemHtmlChildId", document.getElementById(oldElem!.id));
            console.log("oldElemHtmlChildParentId", document.getElementById(oldElem!.parent.id));
            if (child) {
                const rect = child.childNodes[0] as HTMLElement;

                const recthalf1 = rect.cloneNode(false) as HTMLElement;
                const recthalf2 = rect.cloneNode(false) as HTMLElement;

                const width: number = Number(rect.getAttribute("width"));
                recthalf1.setAttribute("width", width / 2);


                recthalf2.setAttribute("width", width / 2);
                recthalf2.setAttribute("x", width / 2);

                if (this.action.widgetSide === "base") {
                    if (rect!.classList) {
                        if (direction === "right") {
                            child.appendChild(recthalf2);
                            //rect!.classList.add("newly-deleted-node-rightthreeway");
                            recthalf2!.classList.add("newly-deleted-node-threeway");
                        }
                        if (direction === "left") {
                            child.appendChild(recthalf1);
                            //rect!.classList.add("newly-deleted-node-rightthreeway");
                            recthalf1!.classList.add("newly-deleted-node-threeway");
                        }
                    }
                }
            }
        } else if (oldElem && oldElem instanceof SEdge) {
            if (this.action.widgetSide === "base") {
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

    markChanges(context: CommandExecutionContext, changes: string[], widgetSide: string): void {
        for (const c of changes) {
            const change = c.split("-")[0];
            if(this.action.comparison.threeWay) {
                const changeSide = c.split("-")[1];
                if (changeSide.toUpperCase() !== widgetSide.toUpperCase()) {
                    continue;
                }
            }
            const changedElem = context.root.index.getById(change);
            if (changedElem && changedElem instanceof TaskNode) {
                const child = document.getElementById(this.action.widgetId + changedElem!.id);
                if (child) {
                    const rect = child.childNodes[0] as HTMLElement;

                    if (rect!.classList) {
                        rect!.classList.add("newly-changed-node");
                    }
                }

            } else if (changedElem && changedElem instanceof SEdge) {
                const child = document.getElementById(this.action.widgetId + changedElem!.id);
                if (child) {
                    const arrow = child!.childNodes[1] as HTMLElement;

                    if (changedElem.cssClasses) {
                        changedElem.cssClasses.concat(["newly-changed-edge"]);
                    } else {
                        changedElem.cssClasses = ["newly-changed-edge"];
                    }
                    if (arrow!.classList) {
                        arrow!.classList.add("newly-changed-arrow");
                    }

                }
            }
        }
    }

    getAdditionsTree(context: CommandExecutionContext, additions: string[]): void {
        for (const add of additions) {
            const node: DiffTreeNode = new DiffTreeNode();
            node.id = add + "_add";
            node.modelElementId = add;
            node.diffSource = this.changedElems.get(add)!.diffSource;
            const newElem = context.root.index.getById(add);
            if (newElem && newElem instanceof TaskNode) {
                node.name = "[TaskNode] " + this.changedElems.get(add)!.name;
                node.elementType = "TaskNode";
            } else if (newElem && newElem instanceof SEdge) {
                node.name = "[SEdge] " + this.changedElems.get(add)!.name;
                node.elementType = "SEdge";
            } else {
                if (newElem) {
                    if (this.changedElems.get(add)!.name) {
                        node.name = "[" + newElem.type + "] " + this.changedElems.get(add)!.name;
                    } else {
                        node.name = "[" + newElem.type + "] " + this.changedElems.get(add)!.id;
                    }
                    node.elementType = newElem.type;
                }
            }
            node.changeType = "add";
            // in case of a threeway comparison, the addition is only contained in one of the widgets and shouldn't be overwritten
            if (newElem && this.action.additionsTree.indexOf(node) < 0) {
                this.action.additionsTree.push(node);
            }
        }
    }

    getDeletionsTree(context: CommandExecutionContext, deletions: string[]): void {
        for (const del of deletions) {
            const node: DiffTreeNode = new DiffTreeNode();
            node.id = del + "_delete";
            node.modelElementId = del;
            node.diffSource = this.changedElems.get(del)!.diffSource;
            const oldElem = context.root.index.getById(del);
            if (oldElem && oldElem instanceof TaskNode) {
                node.name = "[TaskNode] " + this.changedElems.get(del)!.name;
                node.elementType = "TaskNode";
            } else if (oldElem && oldElem instanceof SEdge) {
                node.name = "[SEdge] " + this.changedElems.get(del)!.name;
                node.elementType = "SEdge";
            } else {
                node.name = "[ElemType] " + this.changedElems.get(del)!.name;
                node.elementType = "unknown type";
            }
            node.changeType = "delete";
            if (oldElem && this.action.deletionsTree.indexOf(node) < 0) {
                this.action.deletionsTree.push(node);
            }
        }
    }

    getChangesTree(context: CommandExecutionContext, changes: string[], widgetSide: string): void {
        for (const c of changes) {
            let changeSide = "";
            const change = c.split("-")[0];
            if(this.action.comparison.threeWay) {
                changeSide = c.split("-")[1];
                if (changeSide.toUpperCase() !== widgetSide.toUpperCase() && widgetSide !== "base") {
                    continue;
                }
            }
            const node: DiffTreeNode = new DiffTreeNode();
            node.diffSource = this.changedElems.get(change)!.diffSource;
            if(widgetSide === "base") {
                node.id = change + "_change"+"_BASE";
                if(this.action.changesTree.filter(x => x.id === node.id).length > 0) {
                    continue;
                }
            } else {
                node.id = change + "_change"+"_"+changeSide.toUpperCase();
            }
            node.modelElementId = change;
            const changedElem = context.root.index.getById(change);
            if (changedElem && changedElem instanceof TaskNode) {
                node.name = "[TaskNode] " + this.changedElems.get(change)!.name;
                node.elementType = "TaskNode";
            } else if (changedElem && changedElem instanceof SEdge) {
                node.name = "[SEdge] " + this.changedElems.get(change)!.name;
                node.source;
                node.elementType = "SEdge";
            } else if (changedElem && changedElem instanceof GLSPGraph) {
                node.name = "[GLSPGraph] " + this.changedElems.get(change)!.name;
                node.elementType = "GLSPGraph";
            } else {
                node.name = "[ElemType] " + change;
                node.elementType = "unknown type";
            }
            node.changeType = "change";
            if (node.elementType !== "GLSPGraph") {
                console.log("CHANGENode"+ changeSide, node);
                this.action.changesTree.push(node);
            }
        }
        console.log("CHANGETree"+ widgetSide, this.action.changesTree);
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
        let source = undefined;
        let target = undefined;
        if (threeWay === false) {
            if ((match.right === null) && (match.left != null)) {
                deletions.push(match.left.id);
                let name: string = "";
                const modelElem = context.root.index.getById(match.left.id);
                if (modelElem && modelElem instanceof TaskNode) {
                    name = modelElem.editableLabel!.text;
                } else if (modelElem && modelElem instanceof SEdge) {
                    if (modelElem.source && modelElem.source instanceof TaskNode) {
                        source = modelElem.source.id;
                        name = modelElem.source.editableLabel!.text;
                    }
                    name = name + "->";
                    if (modelElem.target && modelElem.target instanceof TaskNode) {
                        target = modelElem.target.id;
                        name += modelElem.target.editableLabel!.text;
                    }
                }
                const changed = new ChangedElem(match.left.id, name, "delete");
                changed.source = source;
                changed.target = target;
                this.changedElems.set(match.left.id, changed);
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    deletions = deletions.concat(this.getSubMatchDeletions(context, subMatch, threeWay));
                }
            }
        } else {
            if ((match.right === null) && (match.origin != null) && (match.origin.id != null)) {
                deletions.push(match.origin.id);
                this.markThreewayDeletion(context, match.origin.id, "right");
                let name: string = "";
                const modelElem = context.root.index.getById(match.origin.id);
                if (modelElem && modelElem instanceof TaskNode) {
                    name = modelElem.editableLabel!.text;
                } else if (modelElem && modelElem instanceof SEdge) {
                    if (modelElem.source && modelElem.source instanceof TaskNode) {
                        source = modelElem.source.id;
                        name = modelElem.source.editableLabel!.text;
                    }
                    name = name + "->";
                    if (modelElem.target && modelElem.target instanceof TaskNode) {
                        target = modelElem.target.id;
                        name += modelElem.target.editableLabel!.text;
                    }
                }
                const changed = new ChangedElem(match.origin.id, name, "delete-right");
                changed.source = source;
                changed.target = target;
                changed.diffSource = "RIGHT";
                this.changedElems.set(match.origin.id, changed);
            }
            if ((match.left === null) && (match.origin != null) && (match.origin.id != null)) {
                deletions.push(match.origin.id);
                this.markThreewayDeletion(context, match.origin.id, "left");
                let name: string = "";
                const modelElem = context.root.index.getById(match.origin.id);
                if (modelElem && modelElem instanceof TaskNode) {
                    name = modelElem.editableLabel!.text;
                } else if (modelElem && modelElem instanceof SEdge) {
                    if (modelElem.source && modelElem.source instanceof TaskNode) {
                        source = modelElem.source.id;
                        name = modelElem.source.editableLabel!.text;
                    }
                    name = name + "->";
                    if (modelElem.target && modelElem.target instanceof TaskNode) {
                        target = modelElem.target.id;
                        name += modelElem.target.editableLabel!.text;
                    }
                }
                const changed = new ChangedElem(match.origin.id, name, "delete-left");
                changed.source = source;
                changed.target = target;
                changed.diffSource = "LEFT";
                this.changedElems.set(match.origin.id, changed);
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    deletions = deletions.concat(this.getSubMatchDeletions(context, subMatch, threeWay));
                }
            }
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
        let source = undefined;
        let target = undefined;
        if (threeWay === false) {
            if ((match.left === null) && (match.right != null)) {
                additions.push(match.right.id);
                let name: string = "";
                const modelElem = context.root.index.getById(match.right.id);
                if (modelElem && modelElem instanceof TaskNode) {
                    name = modelElem.editableLabel!.text;
                } else if (modelElem && modelElem instanceof SEdge) {
                    if (modelElem.source && modelElem.source instanceof TaskNode) {
                        source = modelElem.source.id;
                        name = modelElem.source.editableLabel!.text;
                    }
                    name = name + "->";
                    if (modelElem.target && modelElem.target instanceof TaskNode) {
                        target = modelElem.target.id;
                        name += modelElem.target.editableLabel!.text;
                    }
                }
                const changed = new ChangedElem(match.right.id, name, "add");
                changed.source = source;
                changed.target = target;
                this.changedElems.set(match.right.id, changed);
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    additions = additions.concat(this.getSubMatchAdditions(context, subMatch, threeWay));
                }
            }
        } else {
            if ((match.left != null) && ((match.origin === null) || (match.origin.id === null))) {
                additions.push(match.left.id);
                let name: string = "";
                const modelElem = context.root.index.getById(match.left.id);
                if (modelElem && modelElem instanceof TaskNode) {
                    name = modelElem.editableLabel!.text;
                } else if (modelElem && modelElem instanceof SEdge) {
                    if (modelElem.source && modelElem.source instanceof TaskNode) {
                        source = modelElem.source.id;
                        name = modelElem.source.editableLabel!.text;
                    }
                    name = name + "->";
                    if (modelElem.target && modelElem.target instanceof TaskNode) {
                        target = modelElem.target.id;
                        name += modelElem.target.editableLabel!.text;
                    }
                }
                const changed = new ChangedElem(match.left.id, name, "add");
                changed.source = source;
                changed.target = target;
                changed.diffSource = "LEFT";
                this.changedElems.set(match.left.id, changed);
            }
            if ((match.right != null) && ((match.origin === null) || (match.origin.id === null))) {
                additions.push(match.right.id);
                let name: string = "";
                const modelElem = context.root.index.getById(match.right.id);
                if (modelElem && modelElem instanceof TaskNode) {
                    name = modelElem.editableLabel!.text;
                } else if (modelElem && modelElem instanceof SEdge) {
                    if (modelElem.source && modelElem.source instanceof TaskNode) {
                        source = modelElem.source.id;
                        name = modelElem.source.editableLabel!.text;
                    }
                    name = name + "->";
                    if (modelElem.target && modelElem.target instanceof TaskNode) {
                        target = modelElem.target.id;
                        name += modelElem.target.editableLabel!.text;
                    }
                }
                const changed = new ChangedElem(match.right.id, name, "add");
                changed.source = source;
                changed.target = target;
                changed.diffSource = "RIGHT";
                this.changedElems.set(match.right.id, changed);
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    additions = additions.concat(this.getSubMatchAdditions(context, subMatch, threeWay));
                }
            }
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
        let source = undefined;
        let target = undefined;
        if (threeWay === false) {
            if ((match.left != null) && (match.right != null) && (match.diffs != null)) {
                if (match.diffs.length > 0) {
                    if (match.diffs[0].kind.includes("CHANGE")) {
                        changes.push(match.right.id);
                        let name: string = "";
                        const modelElem = context.root.index.getById(match.right.id);
                        if (modelElem && modelElem instanceof TaskNode) {
                            name = modelElem.editableLabel!.text;
                        } else if (modelElem && modelElem instanceof SEdge) {
                            if (modelElem.source && modelElem.source instanceof TaskNode) {
                                source = modelElem.source.id;
                                name = modelElem.source.editableLabel!.text;
                            }
                            name = name + "->";
                            if (modelElem.target && modelElem.target instanceof TaskNode) {
                                target = modelElem.target.id;
                                name += modelElem.target.editableLabel!.text;
                            }
                        } else if (modelElem && modelElem instanceof GLSPGraph) {
                            name = modelElem.id;
                        }
                        const changed = new ChangedElem(match.right.id, name, "change");
                        changed.source = source;
                        changed.target = target;
                        this.changedElems.set(match.right.id, changed);
                    }
                }
            }
            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    changes = changes.concat(this.getSubMatchChanges(context, subMatch, threeWay));
                }
            }
        } else {
            if ((((match.left != null) || (match.right != null)) && (match.origin != null) && (match.origin.id != null)) && (match.diffs != null)) {
                if (match.diffs.length > 0) {
                    if (match.diffs[0].kind.includes("CHANGE")) {
                        for (const md of match.diffs) {
                            if(changes.indexOf(match.origin.id + "-" + md.source) === -1) {
                                changes.push(match.origin.id + "-" + md.source);
                            }
                        }
                        let name: string = "";
                        const modelElem = context.root.index.getById(match.origin.id);
                        if (modelElem && modelElem instanceof TaskNode) {
                            name = modelElem.editableLabel!.text;
                        } else if (modelElem && modelElem instanceof SEdge) {
                            if (modelElem.source && modelElem.source instanceof TaskNode) {
                                source = modelElem.source.id;
                                name = modelElem.source.editableLabel!.text;
                            }
                            name = name + "->";
                            if (modelElem.target && modelElem.target instanceof TaskNode) {
                                target = modelElem.target.id;
                                name += modelElem.target.editableLabel!.text;
                            }
                        } else if (modelElem && modelElem instanceof GLSPGraph) {
                            name = modelElem.id;
                        }
                        const changed = new ChangedElem(match.origin.id, name, "change");
                        changed.source = source;
                        changed.target = target;
                        changed.diffSource = this.action.widgetSide!.toUpperCase();
                        this.changedElems.set(match.origin.id, changed);
                    }
                }
            }

            if (match.subMatches != null) {
                for (const subMatch of match.subMatches) {
                    let submatchChanges: string[] = this.getSubMatchChanges(context, subMatch, threeWay);
                    for (const subChange of submatchChanges) {
                        if(changes.indexOf(subChange) === -1) {
                            changes.push(subChange);
                        }
                    }
                }
            }

        }

        return changes;
    }
}
