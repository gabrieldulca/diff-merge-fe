import { ContainerModule } from 'inversify';
import {

    FrontendApplicationContribution, OpenHandler,
    WebSocketConnectionProvider, WidgetFactory
} from '@theia/core/lib/browser';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { ComparisonService, ComparisonServicePath } from '../common';
import { DiffMergeExtensionCommandContribution, DiffMergeExtensionMenuContribution } from './diff-merge-extension-contribution';
import {WidgetExtensionWidget} from "./widget-extension-widget";
import { GLSPClientContribution } from '@eclipse-glsp/theia-integration/lib/browser';
import {DiffMergeExtensionManager} from "./diff-merge-extension-manager";
import { DiagramManagerProvider, DiagramManager } from 'sprotty-theia';

export default new ContainerModule(bind => {
    bind(CommandContribution).to(DiffMergeExtensionCommandContribution);
    bind(MenuContribution).to(DiffMergeExtensionMenuContribution);
    bind(ComparisonService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ComparisonServicePath)).inSingletonScope();

    bind(DiffMergeExtensionCommandContribution).toSelf().inSingletonScope();

    bind(GLSPClientContribution).to(DiffMergeExtensionCommandContribution);
    bind(FrontendApplicationContribution).toService(DiffMergeExtensionCommandContribution);
    bind(WidgetExtensionWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        createWidget: () => ctx.container.get<WidgetExtensionWidget>(WidgetExtensionWidget)
    })).inSingletonScope();

    bind(DiffMergeExtensionManager).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(DiffMergeExtensionManager);
    bind(OpenHandler).toService(DiffMergeExtensionManager);
    bind(WidgetFactory).toService(DiffMergeExtensionManager);
    bind(DiagramManagerProvider).toProvider<DiagramManager>((context) => {
        return () => {
            return new Promise<DiagramManager>((resolve) => {
                const diagramManager = context.container.get<DiffMergeExtensionManager>(DiffMergeExtensionManager);
                resolve(diagramManager);
            });
        };
    });

});
