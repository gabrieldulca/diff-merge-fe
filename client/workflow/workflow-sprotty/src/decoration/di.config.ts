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
import { configureModelElement, IssueMarkerView, SIssueMarker, TYPES } from "@eclipse-glsp/client";
import { ContainerModule } from "inversify";

import { DiffMergeDecorationPlacer } from "./decoration-placer";


const diffMergeDecorationModule = new ContainerModule((bind, _unbind, isBound) => {
    configureModelElement({ bind, isBound }, 'marker', SIssueMarker, IssueMarkerView);
    bind(DiffMergeDecorationPlacer).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(DiffMergeDecorationPlacer);
});

export default diffMergeDecorationModule;
