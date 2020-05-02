import { ContainerModule } from 'inversify';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { ComparisonService, ComparisonServicePath } from '../common';
import { DiffMergeExtensionCommandContribution, DiffMergeExtensionMenuContribution } from './diff-merge-extension-contribution';

export default new ContainerModule(bind => {
    bind(CommandContribution).to(DiffMergeExtensionCommandContribution);
    bind(MenuContribution).to(DiffMergeExtensionMenuContribution);
    bind(ComparisonService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, ComparisonServicePath)).inSingletonScope();
});
