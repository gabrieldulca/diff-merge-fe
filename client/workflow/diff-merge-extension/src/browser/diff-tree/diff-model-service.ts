/*!
 * Copyright (C) 2019 EclipseSource and others.
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
 */
import { ILogger } from '@theia/core';
import { inject, injectable } from 'inversify';
import { TreeEditor } from 'theia-tree-editor';

import { DiffModel } from './diff-model';
import {
    automaticTaskView,
    brewingView,
    diffSchema,
    controlUnitView,
    decisionView,
    dipTrayView,
    flowView,
    machineView,
    manualTaskView,
    mergeView,
    waterTankView,
    weightedFlowView,
    workflowView,
} from './diff-schemas';

@injectable()
export class DiffModelService implements TreeEditor.ModelService {

    constructor(@inject(ILogger) private readonly logger: ILogger) { }

    getDataForNode(node: TreeEditor.Node) {
        return node.jsonforms.data;
    }

    getSchemaForNode(node: TreeEditor.Node) {
        return {
            definitions: diffSchema.definitions,
            ...this.getSubSchemaForNode(node)
        };
    }

    private getSubSchemaForNode(node: TreeEditor.Node) {
        const schema = this.getSchemaForType(node.jsonforms.type);
        if (schema) {
            return schema;
        }
        // there is no type, try to guess
        if (node.jsonforms.data.nodes) {
            return diffSchema.definitions.workflow;
        }
        return undefined;
    }
    private getSchemaForType(type: string) {
        if (!type) {
            return undefined;
        }
        const schema = Object.entries(diffSchema.definitions)
            .map(entry => entry[1])
            .find(
                definition =>
                    definition.properties && definition.properties.eClass.const === type
            );
        if (!schema) {
            this.logger.warn("Can't find definition schema for type " + type);
        }
        return schema;
    }
    getUiSchemaForNode(node: TreeEditor.Node) {
        const schema = this.getUiSchemaForType(node.jsonforms.type);
        if (schema) {
            return schema;
        }
        // there is no type, try to guess
        if (node.jsonforms.data.nodes) {
            return workflowView;
        }
        return undefined;
    }

    private getUiSchemaForType(type: string) {
        if (!type) {
            return undefined;
        }
        switch (type) {
            case DiffModel.Type.Machine:
                return machineView;
            case DiffModel.Type.ControlUnit:
                return controlUnitView;
            case DiffModel.Type.BrewingUnit:
                return brewingView;
            case DiffModel.Type.AutomaticTask:
                return automaticTaskView;
            case DiffModel.Type.ManualTask:
                return manualTaskView;
            case DiffModel.Type.DipTray:
                return dipTrayView;
            case DiffModel.Type.WaterTank:
                return waterTankView;
            case DiffModel.Type.Flow:
                return flowView;
            case DiffModel.Type.WeightedFlow:
                return weightedFlowView;
            case DiffModel.Type.Decision:
                return decisionView;
            case DiffModel.Type.Merge:
                return mergeView;
            default:
                this.logger.warn("Can't find registered ui schema for type " + type);
                return undefined;
        }
    }

    getChildrenMapping(): Map<string, TreeEditor.ChildrenDescriptor[]> {
        return DiffModel.childrenMapping;
    }

    getNameForType(eClass: string): string {
        return DiffModel.Type.name(eClass);
    }
}
