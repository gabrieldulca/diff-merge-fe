import { configureActionHandler, GetViewportAction } from "@eclipse-glsp/client";
import { GLSPClientContribution } from "@eclipse-glsp/theia-integration/lib/browser";
import {
    FrontendApplicationContribution,
    OpenHandler,
    WebSocketConnectionProvider,
    WidgetFactory
} from "@theia/core/lib/browser";
import { CommandContribution, MenuContribution } from "@theia/core/lib/common";
import {ContainerModule, interfaces} from "inversify";
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
import {TreeEditor} from "theia-tree-editor/lib/browser/interfaces";
import {DetailFormWidget} from "theia-tree-editor/lib/browser/detail-form-widget";
import {MasterTreeWidget} from "theia-tree-editor/lib/browser/master-tree-widget";
import {createTreeContainer, TreeProps, TreeWidget as TheiaTreeWidget} from "@theia/core/lib/browser/tree";
import {TREE_PROPS} from "theia-tree-editor/lib/browser/util";


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
        createWidget: () => {

            const treeContainer = createBasicTreeContainter(
                context.container,
                DiffTreeEditorWidget,
                DiffModelService,
                DiffTreeNodeFactory
            );

            // Bind options
            const uri = new URI();
            treeContainer.bind(NavigatableTreeEditorOptions).toConstantValue({ uri });

            return treeContainer.get(DiffTreeEditorWidget);
        }
    }));

    bind(TreeEditor.ModelService).to(DiffModelService);
    bind(TreeEditor.NodeFactory).to(DiffTreeNodeFactory);
    bind(DetailFormWidget).toSelf();
    bind(MasterTreeWidget).toDynamicValue(context => createTreeWidget(context.container));
    const uri = new URI();
    bind(NavigatableTreeEditorOptions).toConstantValue({ uri });
    bind(DiffTreeEditorWidget).toSelf();


    bind(DiffMergeDiagWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        createWidget: () => ctx.container.get<DiffMergeDiagWidget>(DiffMergeDiagWidget)
    })).inSingletonScope();
    bind(DiffMergeDiagManager).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(DiffMergeDiagManager);
    bind(OpenHandler).toService(DiffMergeDiagManager);
    bind(WidgetFactory).toService(DiffMergeDiagManager);

});
function createTreeWidget(
    parent: interfaces.Container
): MasterTreeWidget {
    const treeContainer = createTreeContainer(parent);

    treeContainer.unbind(TheiaTreeWidget);
    treeContainer.bind(MasterTreeWidget).toSelf();
    treeContainer.rebind(TreeProps).toConstantValue(TREE_PROPS);
    return treeContainer.get(MasterTreeWidget);
}
