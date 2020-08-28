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
import { LabelProviderContribution } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { injectable } from 'inversify';
import { TreeEditor } from 'theia-tree-editor';

import { DiffModel } from './diff-model';
import { DiffTreeEditorWidget } from './diff-tree-editor-widget';

const DEFAULT_COLOR = 'black';

const ICON_CLASSES: Map<string, string> = new Map([
  [DiffModel.Type.AutomaticTask, 'fa-cog ' + DEFAULT_COLOR],
  [DiffModel.Type.BrewingUnit, 'fa-fire ' + DEFAULT_COLOR],
  [DiffModel.Type.ControlUnit, 'fa-server ' + DEFAULT_COLOR],
  [DiffModel.Type.Decision, 'fa-chevron-up ' + DEFAULT_COLOR],
  [DiffModel.Type.Dimension, 'fa-arrows-alt ' + DEFAULT_COLOR],
  [DiffModel.Type.DipTray, 'fa-inbox ' + DEFAULT_COLOR],
  [DiffModel.Type.Display, 'fa-tv ' + DEFAULT_COLOR],
  [DiffModel.Type.Flow, 'fa-exchange-alt ' + DEFAULT_COLOR],
  [DiffModel.Type.Fork, 'fa-code-branch fa-rotate-90 ' + DEFAULT_COLOR],
  [DiffModel.Type.Join, 'fa-code-branch fa-rotate-270 ' + DEFAULT_COLOR],
  [DiffModel.Type.Machine, 'fa-cogs ' + DEFAULT_COLOR],
  [DiffModel.Type.ManualTask, 'fa-wrench ' + DEFAULT_COLOR],
  [DiffModel.Type.Merge, 'fa-chevron-down ' + DEFAULT_COLOR],
  [DiffModel.Type.Node, 'fa-circle ' + DEFAULT_COLOR],
  [DiffModel.Type.Processor, 'fa-microchip ' + DEFAULT_COLOR],
  [DiffModel.Type.RAM, 'fa-memory ' + DEFAULT_COLOR],
  [DiffModel.Type.Task, 'fa-tasks ' + DEFAULT_COLOR],
  [DiffModel.Type.WaterTank, 'fa-tint ' + DEFAULT_COLOR],
  [DiffModel.Type.WeightedFlow, 'fa-exchange-alt light-orange'],
  [DiffModel.Type.Workflow, 'fa-random ' + DEFAULT_COLOR],
]);

/* Icon for unknown types */
const UNKNOWN_ICON = 'fa-question-circle ' + DEFAULT_COLOR;

@injectable()
export class DiffTreeLabelProvider implements LabelProviderContribution {

  public canHandle(element: object): number {
    if ((TreeEditor.Node.is(element) || TreeEditor.CommandIconInfo.is(element))
      && element.editorId === DiffTreeEditorWidget.EDITOR_ID) {
      return 1000;
    }
    return 0;
  }

  public getIcon(element: object): string | undefined {
    let iconClass: string = 'far ' + UNKNOWN_ICON;
    if (TreeEditor.CommandIconInfo.is(element)) {
      iconClass = ICON_CLASSES.get(element.type)!;
    } else if (TreeEditor.Node.is(element)) {
      iconClass = ICON_CLASSES.get(element.jsonforms.type)!;
      if (!iconClass && element.jsonforms.property === 'flows') {
        iconClass = ICON_CLASSES.get(DiffModel.Type.Flow)!;
      }
    }

    return iconClass ? 'fa ' + iconClass : 'far ' + UNKNOWN_ICON;
  }

  public getName(element: object): string | undefined {
    const data = TreeEditor.Node.is(element) ? element.jsonforms.data : element;
    if (data.eClass) {
      switch (data.eClass) {
        case DiffModel.Type.Task:
        case DiffModel.Type.AutomaticTask:
        case DiffModel.Type.ManualTask:
        case DiffModel.Type.Machine:
          return data.name || this.getTypeName(data.eClass);
        default:
          // TODO query title of schema
          return this.getTypeName(data.eClass);
      }
    }
    // guess
    if (data.nodes) {
      return data.name || 'Workflow';
    }
    // ugly guess, fix in modelserver
    if (data.source && data.target) {
      return 'Flow';
    }
    return undefined;
  }
  private getTypeName(eClass: string): string {
    const fragment = new URI(eClass).fragment;
    if (fragment.startsWith('//')) {
      return fragment.substring(2);
    }
    return fragment;
  }
}
