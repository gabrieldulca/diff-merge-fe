import { Navigatable, SplitPanel, StatefulWidget } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileNavigatorWidget } from "@theia/navigator/lib/browser";
import {SetViewportAction} from "sprotty";
import { DiagramWidget } from "sprotty-theia";
import {DiffMergeDiagWidget} from "./diff-merge-diag-widget";
import {ViewPortChangeHandler} from "./viewport-change-handler";




export class DiffSplitPanel extends SplitPanel implements StatefulWidget, Navigatable {

    public widgetId = 'testasdas';
    public uri: URI;

    public setNavigator(fileNavigatorWidget: FileNavigatorWidget) {
        this.addWidget(fileNavigatorWidget);
    }

    public setSplitPanel(splitPanel: DiffSplitPanel) {
        this.addWidget(splitPanel);
    }

    public initDiffPanel(leftWidget: DiffMergeDiagWidget, rightWidget: DiffMergeDiagWidget, uri: URI) {

        this.addWidget(leftWidget);
        this.addWidget(rightWidget);

        leftWidget.actionHandlerRegistry.register(SetViewportAction.KIND, new ViewPortChangeHandler(rightWidget));
        rightWidget.actionHandlerRegistry.register(SetViewportAction.KIND, new ViewPortChangeHandler(leftWidget));

        for (const handle of this.handles) {
            handle.classList.add("diff-panel-handle");
        }

        this.uri = uri;
    }

    setURI(uri: URI) {
        this.uri = uri;
    }

    public initThreewayDiffPanel(leftWidget: DiagramWidget, base: DiagramWidget, rightWidget: DiagramWidget, uri: URI) {
        this.addWidget(leftWidget);
        this.addWidget(base);
        this.addWidget(rightWidget);
        this.uri = uri;
    }

    get id(): string {
        return this.widgetId;
    }


    storeState(): object {
        throw new Error("Method not implemented.");
    }
    restoreState(oldState: object): void {
        throw new Error("Method not implemented.");
    }
    getResourceUri(): import("@theia/core/lib/common/uri").default | undefined {
        return this.uri;
    }
    createMoveToUri(resourceUri: import("@theia/core/lib/common/uri").default): import("@theia/core/lib/common/uri").default | undefined {
        throw new Error("Method not implemented.");
    }


}
