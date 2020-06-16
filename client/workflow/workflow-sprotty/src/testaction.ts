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
import { Action, CommandExecutionContext, CommandReturn, FeedbackCommand } from "@eclipse-glsp/client";
import { inject, injectable } from "inversify";

@injectable()
export class ApplyDiffAction implements Action {
    readonly kind = ApplyDiffCommand.KIND;
}

export class ApplyDiffCommand extends FeedbackCommand {
    constructor(@inject(ApplyDiffAction) public readonly action: ApplyDiffAction) { super(); }
    execute(context: CommandExecutionContext): CommandReturn {
        context.root.index.getById("test");
        return context.root;
    }
    static readonly KIND = "applyDiff";
}
