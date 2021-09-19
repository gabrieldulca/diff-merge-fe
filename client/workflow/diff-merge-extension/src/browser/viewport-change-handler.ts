/********************************************************************************
 * Copyright (c) 20020 EclipseSource and others.
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
import { injectable } from "inversify";
import {Action, IActionHandler, ICommand, SetViewportAction} from "sprotty";
import {DiffMergeDiagWidget} from "./diff-merge-diag-widget";

@injectable()
export class ViewPortChangeHandler implements IActionHandler {

    readonly otherWidget: DiffMergeDiagWidget;
    readonly threewayWidget: DiffMergeDiagWidget;

    constructor(otherWidget: DiffMergeDiagWidget, threewayWidget?: DiffMergeDiagWidget) {
        this.otherWidget = otherWidget;
        if (threewayWidget) {
            this.threewayWidget = threewayWidget;
        }
    }

    /*
     * Synchronizes the widgets to each other, so that the viewport allways changes in both/all three of them
     */
    handle(action: SetViewportAction): ICommand | Action | void {
        if (!(action instanceof ForwardedAction)) {
            this.otherWidget.actionDispatcher.dispatch(new ForwardedAction(action));
            if (this.threewayWidget) {
                this.threewayWidget.actionDispatcher.dispatch(new ForwardedAction(action));
            }
        }
    }
}

/*
 * Sets the viewport and makes sure it is not a repeated action
 */
export class ForwardedAction extends SetViewportAction {
    readonly kind: string = "viewport";

    constructor(public readonly setViewportAction: SetViewportAction) {
        super(setViewportAction.elementId, setViewportAction.newViewport, setViewportAction.animate);
    }
}
