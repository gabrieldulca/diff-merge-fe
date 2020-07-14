import { inject, injectable, postConstruct, interfaces, Container } from 'inversify';

import {BaseWidget, ViewContainer, WidgetOpenerOptions, Widget} from "@theia/core/lib/browser";
import {FileNavigatorWidget} from "@theia/navigator/lib/browser";
import {DiffPanel} from "./test-split-panel";

export const DiffPanelWidgetWidgetFactory = Symbol('DiffPanelWidgetWidgetFactory');
export type DiffPanelWidgetWidgetFactory = (options: WidgetOpenerOptions) => DiffPanelWidget;

@injectable()
export class DiffPanelWidget extends BaseWidget {

    static createContainer(parent: interfaces.Container, options: WidgetOpenerOptions): Container {
        const child = new Container({ defaultScope: 'Singleton' });
        child.parent = parent;
        //child.bind(WidgetOpenerOptions).toConstantValue(options);
        child.bind(FileNavigatorWidget).toSelf();
        child.bind(DiffPanel).toSelf();
        child.bind(DiffPanelWidget).toSelf();
        return child;
    }
    static createWidget(parent: interfaces.Container, options: WidgetOpenerOptions): DiffPanelWidget {
        return DiffPanelWidget.createContainer(parent, options).get(DiffPanelWidget);
    }

    protected readonly container = new DiffPanel({ orientation: 'horizontal' });


    @inject(FileNavigatorWidget)
    protected readonly treeNavigator: FileNavigatorWidget;

    @inject(DiffPanel)
    protected readonly panel: DiffPanel;

    @postConstruct()
    protected init(): void {
        this.id = 'debug:session:';
        this.title.closable = true;
        this.title.iconClass = 'fa debug-tab-icon';
        //this.addClass('theia-session-container'); //TODO class for handles
        this.toDispose.pushAll([
            this.treeNavigator,
            this.panel
        ]);

        this.container.addWidget(this.createViewContainer(this.treeNavigator));
        this.container.addWidget(this.createViewContainer(this.panel));

        this.container.addWidget(this.container);
    }


    protected createViewContainer(widget: Widget): Widget {
        const viewContainer = new ViewContainer();
        viewContainer.addWidget(widget);
        return viewContainer;
    }

    getTrackableWidgets(): Widget[] {
        return [
            this.treeNavigator,
            this.panel
        ];
    }

}
