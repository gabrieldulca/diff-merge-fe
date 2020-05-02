/* tslint:disable:file-header */
import { ContainerModule } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common';
import { MyService, MyServicePath } from '../common';
import {MyServiceImpl} from "./my-service-impl";

export default new ContainerModule(bind => {
    console.log("binding service")
    bind(MyServiceImpl).toSelf().inSingletonScope();
    bind(MyService).toService(MyServiceImpl);
    bind(ConnectionHandler).toDynamicValue(context => new JsonRpcConnectionHandler(MyServicePath, () => context.container.get(MyService))).inSingletonScope();
});
