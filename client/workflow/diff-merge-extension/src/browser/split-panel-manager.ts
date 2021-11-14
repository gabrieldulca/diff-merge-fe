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
import { ApplicationShell, WidgetOpenerOptions, SplitPanel } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import {inject, injectable} from "inversify";
import { DiagramManager, DiagramWidgetOptions } from "sprotty-theia";

import { DiffSplitPanel } from "./diff-split-panel";
import { DiffTreeWidget } from "./diff-tree/diff-tree-widget";
import {DiffMergeDiagWidget} from "./diff-merge-diag-widget";
import {WorkflowLanguage} from "@eclipse-glsp-examples/workflow-theia/lib/common/workflow-language";
import {DiffMergeDiagManager} from "./diff-merge-diag-manager";
import { GLSPDiagramManager } from "@eclipse-glsp/theia-integration/lib/browser";


@injectable()
export class SplitPanelManager extends DiagramManager {
    readonly diagramType = "workflow-diagram";
    readonly iconClass = "fa fa-project-diagram";
    readonly label = "Workflow diagram Editor";
    public prevOpts: DiagramWidgetOptions;
    public diffSplitPanel:DiffSplitPanel;

    constructor(
        @inject(DiffMergeDiagManager) protected readonly diagManager: GLSPDiagramManager)
    {super();}

    /*
     * Create SplitPanel to which the DiagramWidgets shall be added
     */
    async createWidgetSplitPanel(options?: any): Promise<DiffSplitPanel> {
        if (DiagramWidgetOptions.is(options)) {
            this.prevOpts = options;
            this.diffSplitPanel = new DiffSplitPanel({ orientation: 'horizontal' });
            return this.diffSplitPanel;
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }

    public getLeftWidget(): DiffMergeDiagWidget {
        return this.diffSplitPanel.leftWidget;
    }

    public getRightWidget(): DiffMergeDiagWidget {
        return this.diffSplitPanel.rightWidget;
    }

    public getBaseWidget(): DiffMergeDiagWidget {
        return this.diffSplitPanel.baseWidget;
    }

    public closeSplitPanel(): void {
        console.log("close split panel");
        this.shell.closeWidget("main-split-panel");
        const pathToMergedFile = this.diffSplitPanel.rightWidget.uri.path.toString().replace(".wf", "_MERGED.wf");
        console.log("PATH", pathToMergedFile);
        const options2: DiagramWidgetOptions = { uri: pathToMergedFile, diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
        this.diagManager.createWidget(options2).then((mergedWidget) => {
            this.shell.addWidget(mergedWidget);
        });
    }

    /*
     * Create main SplitPanel containing the DiffTree and the Splitpanel with the Diagrams
     */
    async doCustomOpen(widget: DiffMergeDiagWidget, widgetSplitPanel: DiffSplitPanel, uri: URI, options: WidgetOpenerOptions, diffTreeWidget: DiffTreeWidget, title: string) {
        const op: WidgetOpenerOptions = {
            mode: options && options.mode ? options.mode : 'activate',
            ...options
        };
        if (!widget.isAttached) {
            const currentEditor = this.editorManager.currentEditor;
            const widgetOptions: ApplicationShell.WidgetOptions = {
                area: 'main',
                ...(options && options.widgetOptions ? options.widgetOptions : {})
            };
            if (!!currentEditor && currentEditor.editor.uri.toString(true) === widget.uri.toString(true)) {
                widgetOptions.ref = currentEditor;
                widgetOptions.mode = options && options.widgetOptions && options.widgetOptions.mode ? options.widgetOptions.mode : 'open-to-right';
            }

            const mainSplitPanel = new SplitPanel({ orientation: 'vertical' });

            mainSplitPanel.id = "main-split-panel";

            diffTreeWidget.setRoot();
            mainSplitPanel.addWidget(diffTreeWidget!);
            mainSplitPanel.addWidget(widgetSplitPanel);
            mainSplitPanel.setRelativeSizes([0.3, 1.0]);

            mainSplitPanel.title.label = title;
            mainSplitPanel.title.iconClass = 'fa navigator-tab-icon';
            mainSplitPanel.title.closable = true;

            for (const handle of mainSplitPanel.handles) {
                handle.classList.add("diff-panel-handle");
            }

            this.shell.addWidget(mainSplitPanel, widgetOptions);
        }
        const promises: Promise<void>[] = [];
        if (op.mode === 'activate') {
            await widget.getSvgElement();
            this.shell.activateWidget(widget.widgetId);
        } else if (op.mode === 'reveal') {
            this.shell.revealWidget(widget.widgetId);
        }
        await Promise.all(promises);
    }

}
