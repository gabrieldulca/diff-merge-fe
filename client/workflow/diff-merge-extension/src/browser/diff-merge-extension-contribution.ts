import {injectable, inject, multiInject} from "inversify";
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
import { EditorManager } from "@theia/editor/lib/browser";
import {AbstractViewContribution, ApplicationShell, WidgetOpenerOptions} from "@theia/core/lib/browser";
import {DiffMergeFeWidget} from "./diff-merge-fe-widget";
import { DiffService } from '@theia/workspace/lib/browser/diff-service';
import { DiagramManagerProvider, DiagramWidgetOptions, DiagramWidget } from "sprotty-theia";
import {WorkflowDiagramManager} from "@eclipse-glsp-examples/workflow-theia/lib/browser/diagram/workflow-diagram-manager";
import {WorkflowLanguage} from "@eclipse-glsp-examples/workflow-theia/lib/common/workflow-language";
import WidgetOptions = ApplicationShell.WidgetOptions;




export const ComparisonExtensionCommand = {
    id: 'Comparison.command',
    label: "Compares two diagrams"
};
export const ComparisonSelectExtensionCommand = {
    id: 'ComparisonSelect.command',
    label: "Selects first diagram for comparison"
};

@injectable()
export class DiffMergeExtensionCommandContribution extends AbstractViewContribution<DiffMergeFeWidget> implements CommandContribution {

    protected _firstComparisonFile: URI | undefined = undefined;
    protected get firstComparisonFile(): URI | undefined {
        return this._firstComparisonFile;
    }
    protected set firstComparisonFile(uri: URI | undefined) {
        this._firstComparisonFile = uri;
    }

    constructor(
        @inject(WorkflowDiagramManager) protected readonly workflowDiagramManager: WorkflowDiagramManager,
        @inject(EditorManager) protected readonly editorManager: EditorManager,
        @inject(DiffService) protected readonly diffService: DiffService,
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(ComparisonService) protected readonly comparisonService: ComparisonService,
        @inject(NavigatorDiff) protected readonly navigatorDiff: NavigatorDiff,
        @inject(SelectionService) protected readonly selectionService: SelectionService,
        @multiInject(DiagramManagerProvider) protected diagramManagerProviders: DiagramManagerProvider[]
) {
        super({
            widgetId: DiffMergeFeWidget.ID,
            widgetName: DiffMergeFeWidget.LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: ComparisonExtensionCommand.id
        });
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ComparisonExtensionCommand, {
            execute: async () => {
                if(this.firstComparisonFile) {
                    console.log("first file", this.firstComparisonFile.path.toString());
                    let secondComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    console.log("second file", secondComparisonFile!.path.toString());
                    const comparison = await this.comparisonService.getComparisonResult(this.firstComparisonFile.path.toString(), secondComparisonFile!.path.toString());
                    console.log("comparison result", comparison);
                    this.messageService.info(JSON.stringify(comparison));

                    await this.workflowDiagramManager.getOrCreateByUri(new URI(this.firstComparisonFile.path.toString()));
                    await this.workflowDiagramManager.getOrCreateByUri(new URI(secondComparisonFile!.path.toString()));

                    let _this = this;
                    let options:DiagramWidgetOptions = {uri: this.firstComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor"};
                    await this.workflowDiagramManager.createWidget(options).then(function (widget: DiagramWidget) { _this.workflowDiagramManager.doOpen(widget);});
                    let options2:DiagramWidgetOptions = {uri: secondComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor"};
                    let widgetOptions: WidgetOptions = {mode: 'split-right'};
                    let wop: WidgetOpenerOptions = {widgetOptions: widgetOptions};
                    await this.workflowDiagramManager.createWidget(options2).then(function (widget: DiagramWidget) {
                        _this.workflowDiagramManager.doOpen(widget,wop);
                        console.log("diagramConfigurationRegistry", widget.diContainer);
                        console.log("diagramConfigurationRegistry", widget.connector);
                    });



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
