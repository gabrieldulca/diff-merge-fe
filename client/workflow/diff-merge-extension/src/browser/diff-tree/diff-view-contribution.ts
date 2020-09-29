/*import { FrontendApplication, FrontendApplicationContribution } from "@theia/core/lib/browser/frontend-application";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { AbstractViewContribution } from "@theia/core/lib/browser/shell/view-contribution";
import { CompositeTreeNode } from "@theia/core/lib/browser/tree";
import { Widget } from "@theia/core/lib/browser/widgets";
import { Command, CommandRegistry } from "@theia/core/lib/common/command";
import { OS } from "@theia/core/lib/common/os";
import { injectable } from "inversify";

import { DiffViewWidget } from "./diff-tree-widget";

export const OUTLINE_WIDGET_FACTORY_ID = 'outline-view';*/

/**
 * Collection of `outline-view` commands.
 */
// export namespace OutlineViewCommands {
/**
 * Command which collapses all nodes
 * from the `outline-view` tree.
 */
/*  export const COLLAPSE_ALL: Command = {
      id: 'outlineView.collapse.all',
      iconClass: 'collapse-all'
  };
}

@injectable()
export class DiffViewContribution extends AbstractViewContribution<DiffViewWidget> implements FrontendApplicationContribution, TabBarToolbarContribution {

  constructor() {
      super({
          widgetId: OUTLINE_WIDGET_FACTORY_ID,
          widgetName: 'Outline',
          defaultWidgetOptions: {
              area: 'right',
              rank: 500
          },
          toggleCommandId: 'outlineView:toggle',
          toggleKeybinding: OS.type() !== OS.Type.Linux
              ? 'ctrlcmd+shift+i'
              : undefined
      });
  }

  async initializeLayout(app: FrontendApplication): Promise<void> {
      await this.openView();
  }

  registerCommands(commands: CommandRegistry): void {
      super.registerCommands(commands);
      commands.registerCommand(OutlineViewCommands.COLLAPSE_ALL, {
          isEnabled: widget => this.withWidget(widget, () => true),
          isVisible: widget => this.withWidget(widget, () => true),
          execute: () => this.collapseAllItems()
      });
  }

  registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
      toolbar.registerItem({
          id: OutlineViewCommands.COLLAPSE_ALL.id,
          command: OutlineViewCommands.COLLAPSE_ALL.id,
          tooltip: 'Collapse All',
          priority: 0
      });
  }*/

/**
 * Collapse all nodes in the outline view tree.
 */
/*protected async collapseAllItems(): Promise<void> {
    const { model } = await this.widget;
    const root = model.root;
    if (CompositeTreeNode.is(root)) {
        model.collapseAll(root);
    }
}*/

/**
 * Determine if the current widget is the `outline-view`.
 */
/* protected withWidget<T>(widget: Widget | undefined = this.tryGetWidget(), cb: (widget: DiffViewWidget) => T): T | false {
     if (widget instanceof DiffViewWidget && widget.id === OUTLINE_WIDGET_FACTORY_ID) {
         return cb(widget);
     }
     return false;
 }
}*/
