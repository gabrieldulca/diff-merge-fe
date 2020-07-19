import { configureActionHandler, GetViewportAction } from "@eclipse-glsp/client";
import { GLSPClientContribution } from "@eclipse-glsp/theia-integration/lib/browser";
import {
    defaultTreeProps,
    FrontendApplicationContribution,
    OpenHandler, TreeDecoratorService, TreeImpl, TreeProps, TreeSearch,
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
import {DiffTreeNavWidget} from "./diff-tree-nav-widget";
import {DetailFormWidget, MasterTreeWidget, TreeEditor} from "theia-tree-editor";
import {TreeModel} from "@theia/core/lib/browser/tree/tree-model";
import {DiffTreeModel} from "./diff-tree-model";
import NodeFactory = TreeEditor.NodeFactory;
import {DiffTreeDecoratorService} from "./diff-tree-decorator-service";
import {Tree} from "@theia/core/lib/browser/tree/tree";
import { FuzzySearch } from "@theia/core/lib/browser/tree/fuzzy-search";
import {SearchBox, SearchBoxFactory, SearchBoxProps} from "@theia/core/lib/browser/tree/search-box";

export const FILE_NAVIGATOR_PROPS = <TreeProps>{
    ...defaultTreeProps,
    contextMenuPath: ['navigator-context-menu'],
    multiSelect: false
};

export default new ContainerModule((bind, _unbind, isBound, rebind) => {
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

    bind(DiffTreeNavWidget).toSelf();
    bind(MasterTreeWidget).toSelf();
    bind(DetailFormWidget).toSelf();
    bind(NodeFactory).toService(SplitPanelManager);
    bind(TreeProps).toConstantValue(FILE_NAVIGATOR_PROPS);

    bind(DiffTreeModel).toSelf();
    bind(TreeSearch).toSelf();
    bind(FuzzySearch).toSelf();
    bind(TreeModel).toService(DiffTreeModel);
    bind(DiffTreeDecoratorService).toSelf().inSingletonScope();
    bind(TreeDecoratorService).toDynamicValue(ctx => ctx.container.get(DiffTreeDecoratorService)).inSingletonScope();
    bind(Tree).toDynamicValue(ctx => ctx.container.get(TreeImpl));
    bind(SearchBoxFactory).toFactory(context =>
        (props: SearchBoxProps) => {
            const { container } = context;
            return container.get(SearchBox);
        }
    );

    bind(FrontendApplicationContribution).toService(DiffMergeDiagManager);
    bind(OpenHandler).toService(DiffMergeDiagManager);
    bind(WidgetFactory).toService(DiffMergeDiagManager);

});

