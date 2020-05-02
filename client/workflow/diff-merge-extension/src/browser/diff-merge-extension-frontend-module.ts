import { ContainerModule } from 'inversify';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { MyService, MyServicePath } from '../common';
import { DiffMergeExtensionCommandContribution, DiffMergeExtensionMenuContribution } from './diff-merge-extension-contribution';

export default new ContainerModule(bind => {
    bind(CommandContribution).to(DiffMergeExtensionCommandContribution);
    bind(MenuContribution).to(DiffMergeExtensionMenuContribution);
    bind(MyService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, MyServicePath)).inSingletonScope();
});
