/* tslint:disable:file-header */
import { ContainerModule } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common';
import { ComparisonService, ComparisonServicePath } from '../common';
import {ComparisonServiceImpl} from "./comparison-service-impl";

export default new ContainerModule(bind => {
    bind(ComparisonServiceImpl).toSelf().inSingletonScope();
    bind(ComparisonService).toService(ComparisonServiceImpl);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(ComparisonServicePath, () => context.container.get(ComparisonService))).inSingletonScope();
});
