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
import { GLSPActionDispatcher } from "@eclipse-glsp/client";
import { inject, injectable } from "inversify";
import { AbstractUIExtension, Action, IActionHandler, ICommand, SetUIExtensionVisibilityAction, TYPES } from "sprotty";

@injectable()
export class EnableFileNameAction implements Action {
    static readonly KIND = "enableFileName";
    public fileName: string;
    public isCurrent:boolean = false;

    /*
     * Action responsible for displaying the filenames in each widget
     */
    constructor(fileName: string, isCurrent?: boolean) {
        this.fileName = fileName;
        if(isCurrent) {
            this.isCurrent = isCurrent;
        }
    }
    readonly kind = EnableFileNameAction.KIND;
}


@injectable()
export class FileNameBanner extends AbstractUIExtension implements IActionHandler {
    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: GLSPActionDispatcher;
    static readonly ID = "file-name-banner";
    private fileName: string;
    public isCurrent:boolean = false;

    /*
     * Displaying the filenames in the diagram widgets
     */
    handle(action: Action): void | Action | ICommand {
        this.fileName = "";
        if (action.kind === EnableFileNameAction.KIND) {
            this.actionDispatcher.dispatch(new SetUIExtensionVisibilityAction(FileNameBanner.ID, true));
            this.fileName = (action as EnableFileNameAction).fileName;
            this.isCurrent = (action as EnableFileNameAction).isCurrent;
        }

    }


    id() { return FileNameBanner.ID; }

    containerClass() { return FileNameBanner.ID; }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.innerText = this.fileName;

        const baseDiv = document.getElementById(this.options.baseDiv);

        // creating div and setting text for filename
        if (baseDiv && baseDiv.parentNode) {
            const div = document.createElement("div");
            div.innerText = this.fileName;
            div.classList.add("filename-banner");

            if(this.isCurrent) {
                const parentDiv = document.createElement("parent-div");
                const div2 = document.createElement("div");
                div2.innerText = "current";
                div2.classList.add("current-file-banner");
                parentDiv.appendChild(div);
                parentDiv.appendChild(div2);
                baseDiv.parentNode.insertBefore(parentDiv, baseDiv);
            } else {
                baseDiv.parentNode.insertBefore(div, baseDiv);
            }

        }
        containerElement.style.display = "none";
    }
}
