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
import {
    ModelSource,
    SChildElement,
    SCompartment,
    SLabel,
    SModelElementSchema,
    SModelRootSchema,
    SShapeElement,
    UpdateModelAction
} from "sprotty";

import { CustomUpdateModelCommand } from "./custom-update-model";
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
    public leftWidgetId: string | undefined;
    public rightWidgetId: string | undefined;
    public baseWidgetId: string | undefined;
    public rightWidgetRoot: SModelRootSchema;
    public leftWidgetRoot: SModelRootSchema;
    public rightWidgetMS: ModelSource;
    public leftWidgetMS: ModelSource;


    constructor(comparison: ComparisonDto, widgetId: string, requestId?: string, widgetSide?: string, leftWidgetId?: string,
        rightWidgetId?: string, leftWidgetMS?: ModelSource, rightWidgetMS?: ModelSource, baseWidgetId?: string) {
        this.widgetId = widgetId.replace("widget", "");
        this.requestId = requestId;
        this.comparison = comparison;
        this.additionsTree = [];
        this.changesTree = [];
        this.deletionsTree = [];
        this.widgetSide = widgetSide;
        if (leftWidgetId != null) {
            this.leftWidgetId = leftWidgetId;
        }
        if (rightWidgetId != null) {
            this.rightWidgetId = rightWidgetId;
        }
        if (rightWidgetMS != null) {
            //console.log("MODELSOURCE right widget", rightWidgetMS);
            this.rightWidgetMS = rightWidgetMS;
            this.rightWidgetRoot = rightWidgetMS.commitModel({
                type: 'NONE',
                id: 'ROOT'
            }) as SModelRootSchema;
            rightWidgetMS.commitModel(this.rightWidgetRoot);
            //console.log("MODELSOURCE right widget promise", this.rightWidgetRoot);
        }
        if (leftWidgetMS != null) {
            //console.log("MODELSOURCE right widget", leftWidgetMS);
            this.leftWidgetMS = leftWidgetMS;
            this.leftWidgetRoot = leftWidgetMS.commitModel({
                type: 'NONE',
                id: 'ROOT'
            }) as SModelRootSchema;
            leftWidgetMS.commitModel(this.leftWidgetRoot);
            //console.log("MODELSOURCE right widget promise", this.leftWidgetRoot);
        }
        if (baseWidgetId != null) {
            this.baseWidgetId = baseWidgetId;
        }

        //console.log("MODELSOURCE right", rightWidgetMS);

    }
    readonly kind = ApplyDiffCommand.KIND;

}

export class ApplyDiffCommand extends FeedbackCommand {
    static readonly KIND = "applyDiff";

    private changedElems: Map<string, ChangedElem>;

    constructor(@inject(TYPES.Action) public readonly action: ApplyDiffAction) { super(); }
    execute(context: CommandExecutionContext): CommandReturn {

        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!
            .querySelectorAll('.newly-added-node')).forEach((el) => el.classList.remove('newly-added-node'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!
            .querySelectorAll('.newly-added-edge')).forEach((el) => el.classList.remove('newly-added-edge'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!
            .querySelectorAll('.newly-added-arrow')).forEach((el) => el.classList.remove('newly-added-arrow'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!
            .querySelectorAll('.newly-deleted-node')).forEach((el) => el.classList.remove('newly-deleted-node'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!
            .querySelectorAll('.newly-deleted-edge')).forEach((el) => el.classList.remove('newly-deleted-edge'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!
            .querySelectorAll('.newly-changed-node')).forEach((el) => el.classList.remove('newly-changed-node'));
        Array.from(document.getElementById(this.action.widgetId.substr(0, this.action.widgetId.length - 1))!
            .querySelectorAll('.newly-changed-edge')).forEach((el) => el.classList.remove('newly-changed-edge'));


        this.changedElems = new Map();


        const additions: string[] = this.getAdditions(context, this.action.comparison);
        console.log("Applying diff command: additions for " + this.action.widgetId, additions);
        const deletions: string[] = this.getDeletions(context, this.action.comparison);
        console.log("Applying diff command: deletions", deletions);
        const changes: string[] = this.getChanges(context, this.action.comparison);
        console.log("Applying diff command: changes", changes);
        console.log("Applying diff command: all diffs", this.changedElems);

        if (!(this.action.widgetSide === "base" && this.action.comparison.threeWay === true)) {
            this.markAdditions(context, additions);
        }
        this.getAdditionsTree(context, additions);

        if (this.action.comparison.threeWay === false) { // For threeway they are marked individually
            this.markDeletions(context, deletions, this.action.rightWidgetRoot, this.action.rightWidgetMS);
        }
        this.getDeletionsTree(context, deletions);

        if (!(this.action.widgetSide === "base" && this.action.comparison.threeWay === true)) {
            this.markChanges(context, changes, this.action.widgetSide!);
        }
        this.getChangesTree(context, changes, this.action.widgetSide!);

        return context.root;
    }

    mapTNToSMESchema(oldElem: TaskNode): SModelElementSchema {
        return {
            type: oldElem.type,
            id: oldElem.id + "_deleted",
            children: this.mapChildrenToSMESchema(oldElem.children),
            name: oldElem.name,
            layout: oldElem.layout,
            position: oldElem.position,
            size: oldElem.size,
            taskType: oldElem.taskType
        } as SModelElementSchema;
    }

    mapEdgeToSMESchema(oldElem: SEdge, deletions: string[]): SModelElementSchema {
        let sid = oldElem.sourceId;
        if (deletions.indexOf(sid) !== -1) {
            sid += "_deleted";
        }
        let tid = oldElem.targetId;
        if (deletions.indexOf(tid) !== -1) {
            tid += "_deleted";
        }
        return {
            type: oldElem.type,
            id: oldElem.id + "_deleted",
            children: [],
            sourceId: sid,
            targetId: tid,
            bounds: oldElem.bounds,
            routerKind: oldElem.routerKind
        } as SModelElementSchema;
    }

    mapChildrenToSMESchema(children: SChildElement[]): SModelElementSchema[] {
        const childrenSchemas: SModelElementSchema[] = [];
        for (const c of children) {
            const schema: any = { id: c.id, type: c.type };
            if (c.children.length > 0) {
                schema.children = this.mapChildrenToSMESchema(c.children as SChildElement[]);
            }
            if (c instanceof SShapeElement) {
                if ((c as SShapeElement).position) {
                    schema.position = (c as SShapeElement).position;
                }
                if ((c as SShapeElement).size) {
                    schema.size = (c as SShapeElement).size;
                }
            }
            if (c instanceof SCompartment) {
                if ((c as SCompartment).layout) {
                    schema.layout = (c as SCompartment).layout;
                }
            }
            if (c instanceof SLabel) {
                if ((c as SLabel).text) {
                    schema.text = (c as SLabel).text;
                }
                if ((c as SLabel).alignment) {
                    schema.alignment = (c as SLabel).alignment;
                }
            }
            childrenSchemas.push(schema);
        }
        return childrenSchemas;
    }

    markDeletions(context: CommandExecutionContext, deletions: string[], widgetRoot: SModelRootSchema, widgetMS: ModelSource): void {
        if ((this.action.comparison.threeWay === false && this.action.widgetSide === "right") || this.action.widgetSide === "base") {
            return;
        }
        console.log("Starting to draw deletions for", this.action.widgetId);
        for (const del of deletions) {
            const oldElem = context.root.index.getById(del);
            if (oldElem) {
                const child = document.getElementById(this.action.widgetId + oldElem!.id);
                if (child) {
                    if (oldElem && oldElem instanceof TaskNode) {
                        let mappedOldElem = this.mapTNToSMESchema(oldElem);
                        widgetRoot.children = widgetRoot.children!.filter(obj => obj.id !== mappedOldElem.id);
                        widgetRoot.children!.push(mappedOldElem);
                    } else if (oldElem && oldElem instanceof SEdge) {
                        let mappedOldElem = this.mapEdgeToSMESchema(oldElem, deletions);
                        widgetRoot.children = widgetRoot.children!.filter(obj => obj.id !== mappedOldElem.id);
                        widgetRoot.children!.push(mappedOldElem);
                    }
                }
            }
        }
        console.log("Starting to commit model");
        widgetMS.commitModel(widgetRoot) as SModelRootSchema;
        CustomUpdateModelCommand.setModelRoot(context, widgetRoot);
        console.log("Starting to color elems", this.action.widgetId);
        widgetMS.actionDispatcher.dispatch(new UpdateModelAction(widgetRoot)).then(
            () => {
                for (const del of deletions) {
                    const oldElem = context.root.index.getById(del);
                    if (oldElem) {
                        let childRight = null;
                        if ((this.action.comparison.threeWay === false) || (this.action.comparison.threeWay === true && this.action.widgetSide === "left")) {
                            childRight = document.getElementById(this.action.rightWidgetId!.replace("widget", "") + oldElem!.id + "_deleted");
                        } else if (this.action.comparison.threeWay === true && this.action.widgetSide === "right") {
                            childRight = document.getElementById(this.action.leftWidgetId!.replace("widget", "") + oldElem!.id + "_deleted");
                        }
                        if (childRight) {
                            if (oldElem && oldElem instanceof TaskNode) {
                                if (oldElem.cssClasses) {
                                    oldElem.cssClasses.concat(["newly-deleted-node"]);
                                } else {
                                    oldElem.cssClasses = ["newly-deleted-node"];
                                }
                                const rect = childRight.childNodes[0] as HTMLElement;
                                if (rect!.classList) {
                                    rect!.classList.add("newly-deleted-node");
                                }
                                console.log("Colored node", childRight);
                            } else if (oldElem && oldElem instanceof SEdge) {
                                if (oldElem.cssClasses) {
                                    oldElem.cssClasses.concat(["newly-deleted-edge"]);
                                } else {
                                    oldElem.cssClasses = ["newly-deleted-edge"];
                                }
                                if (childRight.classList) {
                                    childRight.classList.add("newly-deleted-edge");
                                }
                                const arrow = childRight.childNodes[1] as HTMLElement;
                                if (arrow!.classList) {
                                    arrow!.classList.add("newly-deleted-arrow");
                                }
                                console.log("Colored edge", childRight);
                            }
                        }
                    }
                }
            });
    }

    markThreewayDeletion(context: CommandExecutionContext, del: string, direction: string): void {
        const oldElem = context.root.index.getById(del);
        if (oldElem && oldElem instanceof TaskNode) {
            const child = document.getElementById(this.action.widgetId + oldElem!.id);

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
                            // rect!.classList.add("newly-deleted-node-rightthreeway");
                            recthalf2!.classList.add("newly-deleted-node-threeway");
                        }
                        if (direction === "left") {
                            child.appendChild(recthalf1);
                            // rect!.classList.add("newly-deleted-node-rightthreeway");
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
                        child.classList.add("newly-added-edge");
                        const firtsChild = child!.childNodes[0] as HTMLElement;
                        firtsChild.classList.add("newly-added-edge");
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
            if (this.action.comparison.threeWay) {
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
        console.log("TREE FOR DELETIONS", this.action.widgetSide);
        console.log("TREE FOR DELETIONS DELETIONS", deletions);
        console.log("PREV TREE FOR DELETIONS", this.action.deletionsTree);
        for (const del of deletions) {
            const node: DiffTreeNode = new DiffTreeNode();
            node.id = del + "_deleted";
            node.modelElementId = del;
            node.diffSource = this.changedElems.get(del)!.diffSource;
            const oldElem = context.root.index.getById(del);
            console.log("TREE FOR DELETIONS DEL", del);
            console.log("TREE FOR DELETIONS CONTEXT ROOT", context.root);
            console.log("TREE FOR DELETIONS OLDELEM", oldElem);
            console.log("TREE FOR DELETIONS INDEXOF", this.action.deletionsTree.indexOf(node));
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
        console.log("NEW TREE FOR DELETIONS", this.action.deletionsTree);

    }

    getChangesTree(context: CommandExecutionContext, changes: string[], widgetSide: string): void {
        for (const c of changes) {
            let changeSide = "";
            const change = c.split("-")[0];
            if (this.action.comparison.threeWay) {
                changeSide = c.split("-")[1];
                if (changeSide.toUpperCase() !== widgetSide.toUpperCase() && widgetSide !== "base") {
                    continue;
                }
            }
            const node: DiffTreeNode = new DiffTreeNode();
            node.diffSource = this.changedElems.get(change)!.diffSource;
            if (widgetSide === "base") {
                node.id = change + "_change" + "_BASE";
                if (this.action.changesTree.filter(x => x.id === node.id).length > 0) {
                    continue;
                }
            } else {
                node.id = change + "_change" + "_" + changeSide.toUpperCase();
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
                this.action.changesTree.push(node);
            }
        }
    }

    getDeletions(context: CommandExecutionContext, comparison: ComparisonDto): string[] {
        let deletions: string[] = [];
        let leftSideDeletions: string[] = [];
        let rightSideDeletions: string[] = [];
        if (comparison.matches != null) {
            for (const match of comparison.matches) {
                deletions = deletions.concat(this.getSubMatchDeletions(context, match, comparison.threeWay, leftSideDeletions, rightSideDeletions));
            }
        }
        console.log("right side deletions", rightSideDeletions);
        if (rightSideDeletions.length > 0) {
            this.markDeletions(context, rightSideDeletions, this.action.rightWidgetRoot, this.action.rightWidgetMS);
        }
        console.log("left side deletions", leftSideDeletions);
        if (leftSideDeletions.length > 0) {
            this.markDeletions(context, leftSideDeletions, this.action.leftWidgetRoot, this.action.leftWidgetMS);
        }
        return deletions;
    }

    getSubMatchDeletions(context: CommandExecutionContext, match: MatchDto, threeWay: boolean, leftSideDeletions: string[], rightSideDeletions: string[]): string[] {
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
                    deletions = deletions.concat(this.getSubMatchDeletions(context, subMatch, threeWay, leftSideDeletions, rightSideDeletions));
                }
            }
        } else {
            if ((match.right === null) && (match.origin != null) && (match.origin.id != null)) {
                deletions.push(match.origin.id);
                rightSideDeletions.push(match.origin.id);
                //this.markThreewayDeletion(context, match.origin.id, "right");
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
                leftSideDeletions.push(match.origin.id);
                //this.markThreewayDeletion(context, match.origin.id, "left");
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
                    deletions = deletions.concat(this.getSubMatchDeletions(context, subMatch, threeWay, leftSideDeletions, rightSideDeletions));
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
                changed.diffSource = "RIGHT";
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
                            if (changes.indexOf(match.origin.id + "-" + md.source) === -1) {
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
                    const submatchChanges: string[] = this.getSubMatchChanges(context, subMatch, threeWay);
                    for (const subChange of submatchChanges) {
                        if (changes.indexOf(subChange) === -1) {
                            changes.push(subChange);
                        }
                    }
                }
            }

        }

        return changes;
    }
}
