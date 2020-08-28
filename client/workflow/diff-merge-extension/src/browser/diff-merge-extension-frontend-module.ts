import { configureActionHandler, GetViewportAction } from "@eclipse-glsp/client";
import { GLSPClientContribution } from "@eclipse-glsp/theia-integration/lib/browser";
import {
    FrontendApplicationContribution, NavigatableWidgetOptions,
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
import { ViewPortChangeHandler } from "./viewport-change-handler";
import { SplitPanelManager } from "./split-panel-manager";
import {DiffTreeEditorWidget} from "./diff-tree/diff-tree-editor-widget";
import {createBasicTreeContainter} from "theia-tree-editor";
import {NavigatableTreeEditorOptions} from "theia-tree-editor/lib/browser/navigatable-tree-editor-widget";
import URI from "@theia/core/lib/common/uri";
import { DiffTreeNodeFactory} from "./diff-tree/diff-node-factory";
import {DiffModelService} from "./diff-tree/diff-model-service";
import {DiffTreeLabelProvider} from "./diff-tree/diff-tree-label-provider-contribution";
import {LabelProviderContribution} from "@theia/core/lib/browser/label-provider";


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


    bind(LabelProviderContribution).to(DiffTreeLabelProvider);

    // bind to themselves because we use it outside of the editor widget, too.
    bind(DiffModelService).toSelf().inSingletonScope();
    bind(DiffTreeLabelProvider).toSelf().inSingletonScope();

    bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
        id: DiffTreeEditorWidget.WIDGET_ID,
        createWidget: (options: NavigatableWidgetOptions) => {

            const treeContainer = createBasicTreeContainter(
                context.container,
                DiffTreeEditorWidget,
                DiffModelService,
                DiffTreeNodeFactory
            );

            // Bind options
            const uri = new URI(options.uri);
            treeContainer.bind(NavigatableTreeEditorOptions).toConstantValue({ uri });

            return treeContainer.get(DiffTreeEditorWidget);
        }
    }));


    bind(DiffMergeDiagWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        createWidget: () => ctx.container.get<DiffMergeDiagWidget>(DiffMergeDiagWidget)
    })).inSingletonScope();
    bind(DiffMergeDiagManager).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(DiffMergeDiagManager);
    bind(OpenHandler).toService(DiffMergeDiagManager);
    bind(WidgetFactory).toService(DiffMergeDiagManager);

});
