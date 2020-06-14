import { ApplicationShell, WidgetOpenerOptions } from "@theia/core/lib/browser";
import { injectable } from "inversify";
import { DiagramManager, DiagramWidget, DiagramWidgetOptions } from "sprotty-theia";

import { DiffPanel } from "./test-split-panel";
import {FileNavigatorWidget} from "@theia/navigator/lib/browser";


@injectable()
export class SplitPanelManager extends DiagramManager {
    readonly diagramType = "workflow-diagram";
    readonly iconClass = "fa fa-project-diagram";
    readonly label = "Workflow diagram Editor";
    public prevOpts: DiagramWidgetOptions;

    async createSplitPanel(options?: any): Promise<DiffPanel> {
        if (DiagramWidgetOptions.is(options)) {
            // const clientId = this.createClientId();
            // const config = this.diagramConfigurationRegistry.get(options.diagramType);
            // const diContainer = config.createContainer(clientId);
            this.prevOpts = options;
            const diffPanel = new DiffPanel({orientation: 'horizontal'});
            // diffPanel.initDiffPanel();
            return diffPanel;
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }


    async doCustomOpen(widget: DiagramWidget, splitPanel: DiffPanel, options?: WidgetOpenerOptions, fileNavigatorWidget?: FileNavigatorWidget) {
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

            const split2 =  new DiffPanel({orientation: 'vertical'});
            split2.setNavigator(fileNavigatorWidget!);
            split2.setSplitPanel(splitPanel);
            split2.setRelativeSizes([0.2, 1.0]);

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
