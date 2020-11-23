/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { GLSPActionDispatcher, RequestTypeHintsAction, EnableToolPaletteAction } from "@eclipse-glsp/client";
import { GLSPDiagramWidget, GLSPTheiaDiagramServer } from "@eclipse-glsp/theia-integration/lib/browser";
import { EditorManager, EditorPreferences } from "@theia/editor/lib/browser";
import { Container, injectable } from "inversify";
import {
    ActionHandlerRegistry,
    CenterAction,
    DiagramServer,
    InitializeCanvasBoundsAction,
    ModelSource,
    RequestModelAction,
    TYPES
} from "sprotty";
import { DiagramWidgetOptions, TheiaSprottyConnector } from "sprotty-theia";




@injectable()
export class DiffMergeDiagWidget extends GLSPDiagramWidget {
    public hasToolPalette: boolean = true;

    constructor(options: DiagramWidgetOptions, readonly widgetId: string, readonly diContainer: Container,
        readonly editorPreferences: EditorPreferences, hasToolPalette?: boolean, readonly connector?: TheiaSprottyConnector, readonly editorManager?: EditorManager) {
        super(options, widgetId, diContainer, editorPreferences, connector);
        if(!hasToolPalette) {
            this.hasToolPalette = false;
        }
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


        this.actionDispatcher.dispatch(new RequestModelAction({
            sourceUri: this.options.uri.replace("file://", ""),
            needsClientLayout: 'true',
            needsServerLayout: 'true',
            ...this.options
        }));

        // const modelElement: SModelElement | undefined = context.root.index.getById('task0');
        // const maxSeverityCSSClass = 'error';
        // modelElement.cssClasses = [maxSeverityCSSClass];

        this.actionDispatcher.dispatch(new RequestTypeHintsAction(this.options.diagramType));
        console.log("Tool Palette", this.hasToolPalette);
        if(this.hasToolPalette) {
            this.actionDispatcher.dispatch(new EnableToolPaletteAction());
        }

        const _this = this;
        const newBounds = this.getBoundsInPage(this.node as Element);
        this.actionDispatcher.dispatch(new InitializeCanvasBoundsAction(newBounds));
        this.glspActionDispatcher.onceModelInitialized().then(function () {
            _this.glspActionDispatcher.dispatch(new CenterAction([], false));
        });
        this.glspActionDispatcher.onceModelInitialized().then(function () {
            delay(300).then(() => {

                _this.glspActionDispatcher.dispatch(new CenterAction([]));
            });
        });

    }

    get glspActionDispatcher(): GLSPActionDispatcher {
        return this.diContainer.get(TYPES.IActionDispatcher) as GLSPActionDispatcher;
    }


    get actionHandlerRegistry(): ActionHandlerRegistry {
        return this.diContainer.get<ActionHandlerRegistry>(ActionHandlerRegistry) as ActionHandlerRegistry;
    }

}
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
