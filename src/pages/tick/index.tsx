"use client";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { tickToPrice, priceToTick } from "@/utils/ticks";

export default function TickPage() {
    const [price, setPrice] = useState<string>("");
    const [tick, setTick] = useState<string>("");
    const [calculatedTick, setCalculatedTick] = useState<string>("");
    const [calculatedPrice, setCalculatedPrice] = useState<string>("");

    const handlePriceChange = (value: string) => {
        setPrice(value);
        if (value && !isNaN(Number(value))) {
            const tick = priceToTick(Number(value));
            setCalculatedTick(tick.toString());
        } else {
            setCalculatedTick("");
        }
    };

    const handleTickChange = (value: string) => {
        setTick(value);
        if (value && !isNaN(Number(value))) {
            const price = tickToPrice(Number(value));
            setCalculatedPrice(price.toFixed(6));
        } else {
            setCalculatedPrice("");
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Uniswap V3 Tick Calculator</h1>
            
            <div className="space-y-8">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Price to Tick</h2>
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">Price</label>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                placeholder="Enter price"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">Calculated Tick</label>
                            <Input
                                type="text"
                                value={calculatedTick}
                                readOnly
                                placeholder="Calculated tick"
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Tick to Price</h2>
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">Tick</label>
                            <Input
                                type="number"
                                value={tick}
                                onChange={(e) => handleTickChange(e.target.value)}
                                placeholder="Enter tick"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">Calculated Price</label>
                            <Input
                                type="text"
                                value={calculatedPrice}
                                readOnly
                                placeholder="Calculated price"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
