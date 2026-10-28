"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BecomeResponder } from "@/components/become-responder"

export default function RegisterResponderPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20">
        <div className="container max-w-2xl mx-auto py-12">
          <BecomeResponder />
        </div>
      </main>
      <Footer />
    </>
  )
}
