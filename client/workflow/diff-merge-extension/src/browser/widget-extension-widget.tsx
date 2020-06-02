import {Container, injectable} from 'inversify';
import { GLSPDiagramWidget, GLSPTheiaDiagramServer } from '@eclipse-glsp/theia-integration/lib/browser';
import { ModelSource, TYPES, DiagramServer } from 'sprotty';
import { DiffUris } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { DiagramWidgetOptions, TheiaSprottyConnector } from 'sprotty-theia';
import { EditorPreferences, EditorManager } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { MonacoEditorService } from '@theia/monaco/lib/browser/monaco-editor-service';
import { MonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';

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
                readonly editorPreferences: EditorPreferences, readonly connector?: TheiaSprottyConnector, readonly editorManager?: EditorManager,
                readonly monacoEditorService?: MonacoEditorService, readonly monacoEditorProvider?: MonacoEditorProvider) {
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


        /*const [original, modified] = DiffUris.decode(diffUris);

        const [originalModel, modifiedModel] = await Promise.all([this.getModel(original, toDispose), this.getModel(modified, toDispose)]);*/

        /*monacoEditorService.

        const editor = new MonacoDiffEditor(new URI(this.options.uri),
            document.createElement('div'),
            originalModel: MonacoEditorModel,
            modifiedModel: MonacoEditorModel);

        //const options = this.createMonacoDiffEditorOptions(originalModel, modifiedModel);
        const editor = new MonacoDiffEditor(
            uri,
            document.createElement('div'),
            originalModel, modifiedModel,
            this.services,
            this.diffNavigatorFactory,
            options,
            override);
        toDispose.push(this.editorPreferences.onPreferenceChanged(event => {
            const originalFileUri = original.withoutQuery().withScheme('file').toString();
            if (event.affects(originalFileUri, editor.document.languageId)) {
                this.updateMonacoDiffEditorOptions(editor, event, originalFileUri);
            }
        }));
        toDispose.push(editor.onLanguageChanged(() => this.updateMonacoDiffEditorOptions(editor)));
        return editor;
        const editor = new WidgetExtensionWidget(
            uri,
            document.createElement('div'),
            originalModel, modifiedModel,
            this.services,
            this.diffNavigatorFactory,
            options,
            override);
        toDispose.push(this.editorPreferences.onPreferenceChanged(event => {
            const originalFileUri = original.withoutQuery().withScheme('file').toString();
            if (event.affects(originalFileUri, editor.document.languageId)) {
                this.updateMonacoDiffEditorOptions(editor, event, originalFileUri);
            }
        }));
        toDispose.push(editor.onLanguageChanged(() => this.updateMonacoDiffEditorOptions(editor)));
        return editor;*/
console.log("provider", this.monacoEditorProvider);
console.log("service", this.monacoEditorService);
        let _this = this;

        /*this.actionDispatcher.dispatch(new RequestModelAction({
            sourceUri: diffUris[0].toString(true).replace("file://", ""),
            needsClientLayout: `${this.viewerOptions.needsClientLayout}`,
            ...this.options
        }));*/
        this.createContainer();
        this.createContainer();
        this.diContainer.createChild();
        this.diContainer.createChild();

        let div = document.createElement('div');
        this.monacoEditorProvider!.createInline(new URI(this.options.uri), div)
            .then((function (editor: MonacoEditor) {
            div.title="TEST";
            console.log("editor", editor);

                    editor.dispose();
                    _this.toDispose.dispose();
                }
            ));
        /*this.monacoEditorProvider!.createInline(new URI(diffUris[1].toString(true).replace("file://", "")), document.createElement('div'))
            .then((function (editor: MonacoEditor) {
                    _this.toDispose.push(editor);
                }
            ));*/





        /*this.actionDispatcher.dispatch(new RequestModelAction({
            sourceUri: diffUris[0].toString(true).replace("file://", ""),
            needsClientLayout: `${this.viewerOptions.needsClientLayout}`,
            ...this.options
        }));*/
        //let options2:DiagramWidgetOptions = {uri: secondComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor"};
        //let widgetOptions: WidgetOptions = {mode: 'split-right'};
        //let wop: EditorOpenerOptions = {widgetOptions: widgetOptions};
        //this.editorManager!.open(new URI(diffUris[1].toString(true).replace("file://", "")),wop);

        /*createWidget(options2).then(function (widget: DiagramWidget) {
            _this.workflowDiagramManager.doOpen(widget,wop);
            console.log("diagramConfigurationRegistry", widget.diContainer);
            console.log("diagramConfigurationRegistry", widget.connector);
        });*/



        /*this.actionDispatcher.dispatch(new RequestModelAction({
            sourceUri: diffUris[1].toString(true).replace("file://", ""),
            needsClientLayout: `${this.viewerOptions}`,
            popupDiv:  'sprotty-popup',
            ...this.options
        }));



        this.actionDispatcher.dispatch(new RequestTypeHintsAction(this.options.diagramType));*/
        //this.actionDispatcher.dispatch(new EnableToolPaletteAction());

    }

}
