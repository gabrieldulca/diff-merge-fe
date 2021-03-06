/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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

import {
    GLSPDiagramManager,
    GLSPNotificationManager,
    GLSPTheiaSprottyConnector
} from "@eclipse-glsp/theia-integration/lib/browser";
import { MessageService } from "@theia/core";
import { WidgetManager } from "@theia/core/lib/browser";
import { EditorManager } from "@theia/editor/lib/browser";
import { inject, injectable } from "inversify";
import { TheiaFileSaver } from "sprotty-theia/lib";
import {WorkflowGLSPDiagramClient} from "@eclipse-glsp-examples/workflow-theia/lib/browser/diagram/workflow-glsp-diagram-client";
import {WidgetExtensionWidget} from "./widget-extension-widget";
import {WorkflowLanguage} from "@eclipse-glsp-examples/workflow-theia/lib/common/workflow-language";
import { MonacoEditorProvider } from "@theia/monaco/lib/browser/monaco-editor-provider";
import { MonacoEditorService } from "@theia/monaco/lib/browser/monaco-editor-service";


@injectable()
export class DiffMergeExtensionManager extends GLSPDiagramManager {
    readonly diagramType = WorkflowLanguage.DiagramType;
    readonly iconClass = "fa fa-project-diagram";
    readonly label = "Diff Editor";

    private _diagramConnector: GLSPTheiaSprottyConnector;
    private _monacoEditorService: MonacoEditorService;
    private _monacoEditorProvider:MonacoEditorProvider;

    constructor(
        @inject(WorkflowGLSPDiagramClient) diagramClient: WorkflowGLSPDiagramClient,
        @inject(TheiaFileSaver) fileSaver: TheiaFileSaver,
        @inject(WidgetManager) widgetManager: WidgetManager,
        @inject(EditorManager) editorManager: EditorManager,
        @inject(MessageService) messageService: MessageService,
        @inject(MonacoEditorService) monacoEditorService:MonacoEditorService,
        @inject(MonacoEditorProvider) monacoEditorProvider:MonacoEditorProvider,
        @inject(GLSPNotificationManager) notificationManager: GLSPNotificationManager) {
        super();
        this._monacoEditorService = monacoEditorService;
        this._monacoEditorProvider = monacoEditorProvider;
            this._diagramConnector = new GLSPTheiaSprottyConnector
            ({ diagramClient, fileSaver, editorManager, widgetManager, diagramManager: this, messageService, notificationManager });
    }

    async createWidget(options?: any): Promise<WidgetExtensionWidget> {
        //if (DiagramWidgetOptions.is(options)) {
            const clientId = this.createClientId();
            const config = this.diagramConfigurationRegistry.get(options.diagramType);
            const diContainer = config.createContainer(clientId);
            return new WidgetExtensionWidget(options, clientId + '_widget', diContainer, this.editorPreferences, this.diagramConnector, this.editorManager, this._monacoEditorService, this._monacoEditorProvider);
       // }
       // throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }

    get fileExtensions() {
        return [".wf"];
    }
    get diagramConnector() {
        return this._diagramConnector;
    }
}

