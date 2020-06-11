import { ApplicationShell, SplitPanel, WidgetOpenerOptions } from "@theia/core/lib/browser";
import { injectable } from "inversify";
import { DiagramManager, DiagramWidget, DiagramWidgetOptions } from "sprotty-theia";

import { DiffPanel } from "./test-split-panel";


@injectable()
export class SplitPanelManager extends DiagramManager {
    readonly diagramType = "workflow-diagram";
    readonly iconClass = "fa fa-project-diagram";
    readonly label = "Workflow diagram Editor";

    async createSplitPanel(options?: any): Promise<SplitPanel> {
        if (DiagramWidgetOptions.is(options)) {
            // const clientId = this.createClientId();
            // const config = this.diagramConfigurationRegistry.get(options.diagramType);
            // const diContainer = config.createContainer(clientId);
            const diffPanel = new DiffPanel();
            // diffPanel.initDiffPanel();
            return diffPanel;
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }


    async doCustomOpen(widget: DiagramWidget, splitPanel: SplitPanel, options?: WidgetOpenerOptions) {
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
            this.shell.addWidget(splitPanel, widgetOptions);
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
