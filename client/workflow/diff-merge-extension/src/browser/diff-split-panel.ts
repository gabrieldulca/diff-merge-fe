import { Navigatable, SplitPanel, StatefulWidget } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { SetViewportAction } from "sprotty";

import { DiffMergeDiagWidget } from "./diff-merge-diag-widget";
import { DiffViewWidget } from "./diff-tree/diff-tree-widget";
import { ViewPortChangeHandler } from "./viewport-change-handler";




export class DiffSplitPanel extends SplitPanel implements StatefulWidget, Navigatable {

    public widgetId = 'testasdas';
    public uri: URI;
    public leftWidget: DiffMergeDiagWidget;
    public baseWidget: DiffMergeDiagWidget;
    public rightWidget: DiffMergeDiagWidget;

    public setNavigator(diffViewWidget: DiffViewWidget) {
        this.addWidget(diffViewWidget);
    }

    public setSplitPanel(splitPanel: DiffSplitPanel) {
        this.addWidget(splitPanel);
    }



    public initDiffPanel(leftWidget: DiffMergeDiagWidget, rightWidget: DiffMergeDiagWidget, uri: URI) {
        this.leftWidget = leftWidget;
        this.rightWidget = rightWidget;
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

    public initThreewayDiffPanel(leftWidget: DiffMergeDiagWidget, baseWidget: DiffMergeDiagWidget, rightWidget: DiffMergeDiagWidget, uri: URI) {
        this.leftWidget = leftWidget;
        this.baseWidget = baseWidget;
        this.rightWidget = rightWidget;
        this.addWidget(leftWidget);
        this.addWidget(baseWidget);
        this.addWidget(rightWidget);
        leftWidget.actionHandlerRegistry.register(SetViewportAction.KIND, new ViewPortChangeHandler(baseWidget, rightWidget));
        baseWidget.actionHandlerRegistry.register(SetViewportAction.KIND, new ViewPortChangeHandler(rightWidget, leftWidget));
        rightWidget.actionHandlerRegistry.register(SetViewportAction.KIND, new ViewPortChangeHandler(leftWidget, baseWidget));

        for (const handle of this.handles) {
            handle.classList.add("diff-panel-handle");
        }

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
