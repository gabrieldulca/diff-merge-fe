import { Navigatable, SplitPanel, StatefulWidget } from "@theia/core/lib/browser";
import { DiagramWidget } from "sprotty-theia";



export class DiffPanel extends SplitPanel implements StatefulWidget, Navigatable {

    public widgetId = 'testasdas';

    public initDiffPanel(leftWidget: DiagramWidget, rightWidget: DiagramWidget) {
        this.addWidget(leftWidget);
        this.addWidget(rightWidget);
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
        throw new Error("Method not implemented.");
    }
    createMoveToUri(resourceUri: import("@theia/core/lib/common/uri").default): import("@theia/core/lib/common/uri").default | undefined {
        throw new Error("Method not implemented.");
    }


}
