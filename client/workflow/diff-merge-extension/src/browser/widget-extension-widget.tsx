import {Container, injectable} from 'inversify';
import { GLSPDiagramWidget, GLSPTheiaDiagramServer } from '@eclipse-glsp/theia-integration/lib/browser';
import { ModelSource, TYPES, DiagramServer, RequestModelAction } from 'sprotty';
import { RequestTypeHintsAction, EnableToolPaletteAction } from '@eclipse-glsp/client';
import {ApplicationShell, DiffUris, ViewContainer, WidgetOpenerOptions} from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { DiagramWidgetOptions, TheiaSprottyConnector } from 'sprotty-theia';
import { EditorPreferences, EditorManager, EditorOpenerOptions } from '@theia/editor/lib/browser';
import WidgetOptions = ApplicationShell.WidgetOptions;

@injectable()
export class WidgetExtensionWidget extends GLSPDiagramWidget {

    /*static readonly ID = 'widget-extension:widget';
    static readonly LABEL = 'WidgetExtension Widget';

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @postConstruct()
    protected async init(): Promise < void> {
        this.id = WidgetExtensionWidget.ID;
        this.title.label = WidgetExtensionWidget.LABEL;
        this.title.caption = WidgetExtensionWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        this.update();
    }

    protected render(): React.ReactNode {
        const header = `This is a sample widget which simply calls the messageService
        in order to display an info message to end users.`;
        return <div id='widget-container'>
            <AlertMessage type='INFO' header={header} />
            <button className='theia-button secondary' title='Display Message' onClick={_a => this.displayMessage()}>Display Message</button>
        </div>
    }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: WidgetExtension Widget Successfully Created!');
    }*/

    constructor(options: DiagramWidgetOptions, readonly widgetId: string, readonly diContainer: Container,
                readonly editorPreferences: EditorPreferences, readonly connector?: TheiaSprottyConnector, readonly editorManager?: EditorManager) {
        super(options, widgetId, diContainer, editorPreferences, connector);

    }

    protected initializeSprotty(): void {
        console.log("asdasfsafa", this.options.uri);
        const modelSource = this.diContainer.get<ModelSource>(TYPES.ModelSource);
        if (modelSource instanceof DiagramServer)
            modelSource.clientId = this.id;
        if (modelSource instanceof GLSPTheiaDiagramServer && this.connector)
            this.connector.connect(modelSource);

        this.disposed.connect(() => {
            if (modelSource instanceof GLSPTheiaDiagramServer && this.connector)
                this.connector.disconnect(modelSource);
        });
        let diffUris: URI[] = DiffUris.decode(new URI(this.options.uri));
        console.log("container", this.diContainer);
        console.log("diffUris", diffUris);
        console.log("sourceUri1", diffUris[0].toString(true).replace("file://", ""));
        console.log("sourceUri2", diffUris[1].toString(true).replace("file://", ""));



        this.actionDispatcher.dispatch(new RequestModelAction({
            sourceUri: diffUris[0].toString(true).replace("file://", ""),
            needsClientLayout: `${this.viewerOptions.needsClientLayout}`,
            ...this.options
        }));
        //let options2:DiagramWidgetOptions = {uri: secondComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor"};
        //let widgetOptions: WidgetOptions = {mode: 'split-right'};
        //let wop: EditorOpenerOptions = {widgetOptions: widgetOptions};
        //this.editorManager!.open(new URI(diffUris[1].toString(true).replace("file://", "")),wop);

        /*createWidget(options2).then(function (widget: DiagramWidget) {
            _this.workflowDiagramManager.doOpen(widget,wop);
            console.log("diagramConfigurationRegistry", widget.diContainer);
            console.log("diagramConfigurationRegistry", widget.connector);
        });*/

        const bodyDiv = document.createElement("div");
        bodyDiv.classList.add("palette-body");

        this.actionDispatcher.dispatch(new RequestModelAction({
            sourceUri: diffUris[1].toString(true).replace("file://", ""),
            needsClientLayout: `${this.viewerOptions}`,
            popupDiv:  'sprotty-popup',
            ...this.options
        }));



        this.actionDispatcher.dispatch(new RequestTypeHintsAction(this.options.diagramType));
        this.actionDispatcher.dispatch(new EnableToolPaletteAction());

    }

}
