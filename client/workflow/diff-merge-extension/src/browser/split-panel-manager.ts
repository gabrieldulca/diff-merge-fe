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
import { ApplicationShell, WidgetOpenerOptions } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { injectable } from "inversify";
import { DiagramManager, DiagramWidget, DiagramWidgetOptions } from "sprotty-theia";

import { DiffSplitPanel } from "./diff-split-panel";
import { DiffViewWidget } from "./diff-tree/diff-tree-widget";


@injectable()
export class SplitPanelManager extends DiagramManager {
    readonly diagramType = "workflow-diagram";
    readonly iconClass = "fa fa-project-diagram";
    readonly label = "Workflow diagram Editor";
    public prevOpts: DiagramWidgetOptions;

    async createSplitPanel(options?: any): Promise<DiffSplitPanel> {
        if (DiagramWidgetOptions.is(options)) {
            // const clientId = this.createClientId();
            // const config = this.diagramConfigurationRegistry.get(options.diagramType);
            // const diContainer = config.createContainer(clientId);
            this.prevOpts = options;
            const diffPanel = new DiffSplitPanel({ orientation: 'horizontal' });
            // diffPanel.initDiffPanel();
            return diffPanel;
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }


    async doCustomOpen(widget: DiagramWidget, splitPanel: DiffSplitPanel, uri: URI, options: WidgetOpenerOptions, diffViewWidget: DiffViewWidget, title: string) {
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

            const split2 = new DiffSplitPanel({ orientation: 'vertical' });

            split2.setNavigator(diffViewWidget!);
            split2.setSplitPanel(splitPanel);
            split2.setRelativeSizes([0.2, 1.0]);

            split2.title.label = title;
            split2.title.iconClass = 'fa navigator-tab-icon';
            split2.title.closable = true;

            for (const handle of split2.handles) {
                handle.classList.add("diff-panel-handle");
            }

            this.shell.addWidget(split2, widgetOptions);
        }
        const promises: Promise<void>[] = [];
        if (op.mode === 'activate') {
            await widget.getSvgElement();
            // promises.push(this.onActive(widget));
            // promises.push(this.onReveal(widget));
            this.shell.activateWidget(widget.widgetId);
        } else if (op.mode === 'reveal') {
            // promises.push(this.onReveal(widget));
            this.shell.revealWidget(widget.widgetId);
        }
        await Promise.all(promises);
    }

}
