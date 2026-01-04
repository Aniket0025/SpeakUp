"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, Sparkles } from "lucide-react"

export function MatchingModal({ isOpen, onClose, mode }: { isOpen: boolean; onClose: () => void; mode: string }) {
  const [status, setStatus] = useState<"matching" | "ready">("matching")

  useEffect(() => {
    if (isOpen) {
      setStatus("matching")
      const timer = setTimeout(() => setStatus("ready"), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[40px] p-10 border-0 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {status === "matching" ? (
            <>
              <div className="relative mb-8">
                <div className="h-24 w-24 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="h-10 w-10 text-violet-600" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Finding Participants</h2>
              <p className="text-gray-500 font-medium">Matching you with peers for {mode}...</p>
            </>
          ) : (
            <>
              <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mb-8 animate-bounce">
                <Sparkles className="h-12 w-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Match Found!</h2>
              <p className="text-gray-500 font-medium mb-8">Ready to start your {mode} session?</p>
              <div className="flex gap-4 w-full">
                <Button variant="ghost" onClick={onClose} className="flex-1 rounded-2xl h-14 font-bold border-2">
                  Cancel
                </Button>
                <Button className="flex-1 rounded-2xl h-14 font-bold bg-violet-600 shadow-lg shadow-violet-500/20">
                  Enter Room
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
