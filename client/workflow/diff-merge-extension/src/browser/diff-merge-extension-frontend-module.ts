import { configureActionHandler, GetViewportAction } from "@eclipse-glsp/client";
import { GLSPClientContribution } from "@eclipse-glsp/theia-integration/lib/browser";
import {
    FrontendApplicationContribution,
    OpenHandler,
    WebSocketConnectionProvider,
    WidgetFactory
} from "@theia/core/lib/browser";
import { CommandContribution, MenuContribution } from "@theia/core/lib/common";
import { ContainerModule } from "inversify";
import { DiagramManager, DiagramManagerProvider } from "sprotty-theia";

import { ComparisonService, ComparisonServicePath } from "../common";
import { DiffMergeDiagManager } from "./diff-merge-diag-manager";
import { DiffMergeDiagWidget } from "./diff-merge-diag-widget";
import {
    DiffMergeExtensionCommandContribution,
    DiffMergeExtensionMenuContribution
} from "./diff-merge-extension-contribution";
import { ViewPortChangeHandler } from "./handler";
import { SplitPanelManager } from "./split-panel-manager";

export default new ContainerModule((bind, _unbind, isBound) => {
    bind(CommandContribution).to(DiffMergeExtensionCommandContribution);
    bind(MenuContribution).to(DiffMergeExtensionMenuContribution);
    bind(ComparisonService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ComparisonServicePath)).inSingletonScope();

    bind(DiffMergeExtensionCommandContribution).toSelf().inSingletonScope();

    bind(GLSPClientContribution).to(DiffMergeExtensionCommandContribution);
    bind(FrontendApplicationContribution).toService(DiffMergeExtensionCommandContribution);

    bind(SplitPanelManager).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(SplitPanelManager);
    bind(OpenHandler).toService(SplitPanelManager);
    bind(WidgetFactory).toService(SplitPanelManager);
    configureActionHandler({ bind, isBound }, GetViewportAction.KIND, ViewPortChangeHandler);
    bind(DiagramManagerProvider).toProvider<DiagramManager>((context) => {
        return () => {
            return new Promise<DiagramManager>((resolve) => {
                const diagramManager = context.container.get<SplitPanelManager>(SplitPanelManager);
                resolve(diagramManager);
            });
        };
    });



    bind(DiffMergeDiagWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        createWidget: () => ctx.container.get<DiffMergeDiagWidget>(DiffMergeDiagWidget)
    })).inSingletonScope();
    bind(DiffMergeDiagManager).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(DiffMergeDiagManager);
    bind(OpenHandler).toService(DiffMergeDiagManager);
    bind(WidgetFactory).toService(DiffMergeDiagManager);

});
