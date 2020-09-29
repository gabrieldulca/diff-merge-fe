/*import "../../src/browser/styles/index.css";

import {
    bindViewContribution,
    createTreeContainer,
    defaultTreeProps,
    FrontendApplicationContribution,
    TreeDecoratorService,
    TreeModel,
    TreeModelImpl,
    TreeProps,
    TreeWidget
} from "@theia/core/lib/browser";
import { TabBarToolbarContribution } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { WidgetFactory } from "@theia/core/lib/browser/widget-manager";
import { bindContributionProvider } from "@theia/core/lib/common/contribution-provider";
import { ContainerModule, interfaces } from "inversify";

import { DiffDecoratorService, DiffTreeDecorator } from "./diff-decorator-service";
import { DiffViewWidget, DiffViewWidgetFactory } from "./diff-tree-widget";
import { DiffViewContribution } from "./diff-view-contribution";
import { DiffViewService } from "./diff-view-service";
import { DiffViewTreeModel } from "./diff-view-tree";

export default new ContainerModule(bind => {
    bind(DiffViewWidgetFactory).toFactory(ctx =>
        () => createDiffViewWidget(ctx.container)
    );

    bind(DiffViewService).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(DiffViewService);

    bindViewContribution(bind, DiffViewContribution);
    bind(FrontendApplicationContribution).toService(DiffViewContribution);
    bind(TabBarToolbarContribution).toService(DiffViewContribution);
});*/

/**
 * Create an `DiffViewWidget`.
 * - The creation of the `DiffViewWidget` includes:
 *  - The creation of the tree widget itself with it's own customized props.
 *  - The binding of necessary components into the container.
 * @param parent the Inversify container.
 *
 * @returns the `OutlineViewWidget`.
 */
/*function createDiffViewWidget(parent: interfaces.Container): DiffViewWidget {
    const child = createTreeContainer(parent);

    child.rebind(TreeProps).toConstantValue({ ...defaultTreeProps, search: true });

    child.unbind(TreeWidget);
    child.bind(DiffViewWidget).toSelf();

    child.unbind(TreeModelImpl);
    child.bind(DiffViewTreeModel).toSelf();
    child.rebind(TreeModel).toService(DiffViewTreeModel);

    child.bind(DiffDecoratorService).toSelf().inSingletonScope();
    child.rebind(TreeDecoratorService).toDynamicValue(ctx => ctx.container.get(DiffDecoratorService)).inSingletonScope();
    bindContributionProvider(child, DiffTreeDecorator);

    return child.get(DiffViewWidget);
}
*/
