import { injectable, inject } from "inversify";
import {
    CommandContribution,
    CommandRegistry,
    MenuContribution,
    MenuModelRegistry,
    MessageService
} from "@theia/core/lib/common";
import {NavigatorContextMenu} from "@theia/navigator/lib/browser/navigator-contribution";
import { ComparisonService } from "../common";
import {NavigatorDiff} from "@theia/navigator/lib/browser/navigator-diff";
import {SelectionService, UriSelection} from "@theia/core";
import URI from "@theia/core/lib/common/uri";

export const ComparisonExtensionCommand = {
    id: 'Comparison.command',
    label: "Compares two diagrams"
};
export const ComparisonSelectExtensionCommand = {
    id: 'ComparisonSelect.command',
    label: "Selects first diagram for comparison"
};

@injectable()
export class DiffMergeExtensionCommandContribution implements CommandContribution {

    protected _firstComparisonFile: URI | undefined = undefined;
    protected get firstComparisonFile(): URI | undefined {
        return this._firstComparisonFile;
    }
    protected set firstComparisonFile(uri: URI | undefined) {
        this._firstComparisonFile = uri;
    }

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(ComparisonService) protected readonly comparisonService: ComparisonService,
        @inject(NavigatorDiff) protected readonly navigatorDiff: NavigatorDiff,
        @inject(SelectionService) protected readonly selectionService: SelectionService
    ) { }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ComparisonExtensionCommand, {
            execute: async () => {
                if(this.firstComparisonFile) {
                    console.log("first file", this.firstComparisonFile.path.toString());
                    let secondComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    console.log("second file", secondComparisonFile!.path.toString());
                    const comparison = await this.comparisonService.getComparisonResult();
                    console.log("comparison result", comparison);
                    this.messageService.info(JSON.stringify(comparison));
                } else {
                    this.messageService.info("Please select the first file for comparison");
                }
            }
        });

        registry.registerCommand(ComparisonSelectExtensionCommand, {
            execute: async () => {
                this.firstComparisonFile = UriSelection.getUri(this.selectionService.selection);
                console.log("file1",this.firstComparisonFile);
                this.messageService.info("Selected first file");

            }
        });
    }
}

@injectable()
export class DiffMergeExtensionMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonExtensionCommand.id,
            label: 'EMF Compare with selected'
        });
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonSelectExtensionCommand.id,
            label: 'EMF Select for comparison'
        });
    }

}
