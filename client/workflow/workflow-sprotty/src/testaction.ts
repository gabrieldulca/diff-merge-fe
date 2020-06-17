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
import { Action, CommandExecutionContext, CommandReturn, FeedbackCommand, TYPES } from "@eclipse-glsp/client";
import { inject, injectable } from "inversify";

@injectable()
export class ApplyDiffAction implements Action {
    readonly kind = ApplyDiffCommand.KIND;
}

export class ApplyDiffCommand extends FeedbackCommand {
    constructor(@inject(TYPES.Action) public readonly action: ApplyDiffAction) { super(); }
    execute(context: CommandExecutionContext): CommandReturn {
        console.log("Applying diff command");
        const newTask = context.root.index.getById("511d1376-2052-4890-b939-e609978f9eb9");
        if (newTask && newTask.cssClasses) {
            newTask.cssClasses.concat(["newly-added-node"]);
        }
        const newEdge = context.root.index.getById("00e8fe5f-7825-4f57-97d0-26e833b7bbeb");
        if (newEdge && newEdge.cssClasses) {
            newEdge.cssClasses.concat(["newly-added-edge"]);
        }
        return context.root;
    }
    static readonly KIND = "applyDiff";
}
