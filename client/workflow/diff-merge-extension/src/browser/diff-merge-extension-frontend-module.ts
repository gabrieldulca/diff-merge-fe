import { configureActionHandler, GetViewportAction } from "@eclipse-glsp/client";
import { GLSPClientContribution } from "@eclipse-glsp/theia-integration/lib/browser";
import {
    createTreeContainer,
    defaultTreeProps,
    FrontendApplicationContribution,
    OpenHandler,
    TreeDecoratorService,
    TreeModel,
    TreeModelImpl,
    TreeWidget,
    WebSocketConnectionProvider,
    WidgetFactory
} from "@theia/core/lib/browser";
import { CommandContribution, MenuContribution } from "@theia/core/lib/common";
import { ContainerModule, interfaces } from "inversify";
import { DiagramManager, DiagramManagerProvider } from "sprotty-theia";

import { ComparisonService, ComparisonServicePath } from "../common";
import { DiffMergeDiagManager } from "./diff-merge-diag-manager";
import { DiffMergeDiagWidget } from "./diff-merge-diag-widget";
import {
    DiffMergeExtensionCommandContribution,
    DiffMergeExtensionMenuContribution
} from "./diff-merge-extension-contribution";
import { DiffDecoratorService, DiffTreeDecorator } from "./diff-tree/diff-decorator-service";
import { DiffLabelProvider } from "./diff-tree/diff-label-provider";
import { DiffTreeProps } from "./diff-tree/diff-tree-props";
import { DiffTreeService } from "./diff-tree/diff-tree-service";
import { DiffViewWidget, DiffViewWidgetFactory } from "./diff-tree/diff-tree-widget";
import { DiffViewTreeModel } from "./diff-tree/diff-view-tree";
import { SplitPanelManager } from "./split-panel-manager";
import { ViewPortChangeHandler } from "./viewport-change-handler";

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

    bind(DiffViewWidgetFactory).toFactory(ctx =>
        () => createDiffViewWidget(ctx.container)
    );

    bind(DiffTreeService).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(DiffTreeService);

});

/**
 * Create an `DiffViewWidget`.
 * - The creation of the `DiffViewWidget` includes:
 *  - The creation of the tree widget itself with it's own customized props.
 *  - The binding of necessary components into the container.
 * @param parent the Inversify container.
 *
 * @returns the `OutlineViewWidget`.
 */
function createDiffViewWidget(parent: interfaces.Container): DiffViewWidget {
    const child = createTreeContainer(parent);

    child.bind(DiffTreeProps).toConstantValue({ ...defaultTreeProps, search: true });

    child.unbind(TreeWidget);
    child.bind(DiffViewWidget).toSelf();

    child.unbind(TreeModelImpl);
    child.bind(DiffViewTreeModel).toSelf();
    child.rebind(TreeModel).toService(DiffViewTreeModel);

    // child.bind(DiffDecoratorService).toSelf().inSingletonScope();
    // child.rebind(TreeDecoratorService).toDynamicValue(ctx => ctx.container.get(DiffDecoratorService)).inSingletonScope();
    bindDiffTreeDecorator(child);

    return child.get(DiffViewWidget);
}


function bindDiffTreeDecorator(parent: interfaces.Container): void {
    parent.bind(DiffTreeDecorator).toSelf().inSingletonScope();
    parent.bind(DiffLabelProvider).toSelf().inSingletonScope();
    parent.bind(DiffDecoratorService).toSelf().inSingletonScope();
    parent.rebind(TreeDecoratorService).toService(DiffDecoratorService);

}
