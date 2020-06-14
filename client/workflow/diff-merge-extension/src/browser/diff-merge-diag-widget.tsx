import { RequestTypeHintsAction } from "@eclipse-glsp/client";
import { GLSPDiagramWidget, GLSPTheiaDiagramServer } from "@eclipse-glsp/theia-integration/lib/browser";
import { EditorManager, EditorPreferences } from "@theia/editor/lib/browser";
import { Container, injectable } from "inversify";
import { DiagramServer, ModelSource, RequestModelAction, TYPES, CenterAction, InitializeCanvasBoundsAction } from "sprotty";
import { DiagramWidgetOptions, TheiaSprottyConnector } from "sprotty-theia";


@injectable()
export class DiffMergeDiagWidget extends GLSPDiagramWidget {

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


        const setModelAction = this.actionDispatcher.request(new RequestModelAction({
            sourceUri: this.options.uri.replace("file://", ""),
            needsClientLayout: `${this.viewerOptions.needsClientLayout}`,
            ...this.options
        }, '123')).then(function (resp) {
            console.log('setmodelaction', resp);
        });
        console.log('setmodelaction3', setModelAction);

        // const modelElement: SModelElement | undefined = context.root.index.getById('task0');
        // const maxSeverityCSSClass = 'error';
        // modelElement.cssClasses = [maxSeverityCSSClass];

        this.actionDispatcher.dispatch(new RequestTypeHintsAction(this.options.diagramType));
        //this.actionDispatcher.dispatch(new EnableToolPaletteAction());
        const newBounds = this.getBoundsInPage(this.node as Element);
        this.actionDispatcher.dispatch(new InitializeCanvasBoundsAction(newBounds));
        this.actionDispatcher.dispatch(new CenterAction([], false));

    }



}
