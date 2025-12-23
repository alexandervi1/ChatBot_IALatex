import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentOutline } from "./document-outline";
import { SymbolPicker } from "./symbol-picker";
import { List, Sigma } from "lucide-react";

interface EditorSidebarProps {
    text: string;
    onNavigate: (line: number) => void;
    onInsertSymbol: (latex: string) => void;
}

export function EditorSidebar({ text, onNavigate, onInsertSymbol }: EditorSidebarProps) {
    return (
        <div className="h-full bg-background border-r flex flex-col">
            <Tabs defaultValue="outline" className="flex-1 flex flex-col min-h-0">
                <div className="border-b px-2 py-2">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="outline" className="text-xs">
                            <List className="mr-2 h-3 w-3" /> Estructura
                        </TabsTrigger>
                        <TabsTrigger value="symbols" className="text-xs">
                            <Sigma className="mr-2 h-3 w-3" /> Símbolos
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="outline" className="flex-1 overflow-hidden m-0 p-0">
                    <div className="h-full overflow-y-auto">
                        <DocumentOutline text={text} onNavigate={onNavigate} />
                    </div>
                </TabsContent>

                <TabsContent value="symbols" className="flex-1 overflow-hidden m-0 p-0">
                    <div className="h-full overflow-y-auto">
                        <SymbolPicker onInsert={onInsertSymbol} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
