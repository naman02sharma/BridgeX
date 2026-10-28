import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute total pages and draw
    professional running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress header and footer on the cover page
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Top Header
        self.drawString(50, 756, "BRIDGEX")
        self.setFont("Helvetica", 8)
        self.drawString(98, 756, "|   Global Multilingual Emergency Response Platform Report")
        
        # Header dividing rule
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(50, 748, 562, 748)

        # Footer dividing rule
        self.line(50, 42, 562, 42)

        # Running Footer
        self.drawString(50, 30, "Confidential - Official System Architecture & Engineering Report")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(562, 30, page_str)
        self.restoreState()


def create_callout(text, title="KEY HIGHLIGHT", bg_color="#F8FAFC", border_color="#2563EB", styles=None):
    """Creates a callout box with a prominent left accent border."""
    content = []
    if title:
        content.append(Paragraph(f"<b><font color='{border_color}'>{title}</font></b>", styles["CalloutTitle"]))
        content.append(Spacer(1, 3))
    content.append(Paragraph(text, styles["CalloutText"]))
    
    table = Table([[content]], colWidths=[512])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_color)),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LINELEFT', (0,0), (0,0), 3.5, colors.HexColor(border_color)),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    return table


def create_table(header_data, rows_data, col_widths, styles):
    """Creates a clean, publication-formatted table with alternating rows."""
    formatted_data = []
    
    # Header
    header_row = [Paragraph(f"<b>{cell}</b>", styles["TableHeader"]) for cell in header_data]
    formatted_data.append(header_row)
    
    # Rows
    for row in rows_data:
        formatted_row = []
        for cell in row:
            if isinstance(cell, str):
                formatted_row.append(Paragraph(cell, styles["TableCell"]))
            else:
                formatted_row.append(cell)
        formatted_data.append(formatted_row)
        
    t = Table(formatted_data, colWidths=col_widths, repeatRows=1)
    t_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 6.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
    ]
    
    for r in range(1, len(formatted_data)):
        if r % 2 == 0:
            t_style.append(('BACKGROUND', (0, r), (-1, r), colors.HexColor("#F8FAFC")))
            
    t.setStyle(TableStyle(t_style))
    return t


def build_pdf(filename="BridgeX_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=48,
        bottomMargin=48,
    )

    base_styles = getSampleStyleSheet()
    styles = {}

    # Custom typography hierarchy
    styles["CoverTitle"] = ParagraphStyle(
        "CoverTitle",
        fontName="Helvetica-Bold",
        fontSize=36,
        leading=42,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=12,
    )
    styles["CoverBadge"] = ParagraphStyle(
        "CoverBadge",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#DC2626"),
        spaceAfter=16,
    )
    styles["CoverSubtitle"] = ParagraphStyle(
        "CoverSubtitle",
        fontName="Helvetica",
        fontSize=15,
        leading=22,
        textColor=colors.HexColor("#334155"),
        spaceAfter=25,
    )
    styles["CoverMetaLabel"] = ParagraphStyle(
        "CoverMetaLabel",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#64748B"),
    )
    styles["CoverMetaVal"] = ParagraphStyle(
        "CoverMetaVal",
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#0F172A"),
    )

    styles["H1"] = ParagraphStyle(
        "ReportH1",
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True,
    )
    styles["H2"] = ParagraphStyle(
        "ReportH2",
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True,
    )
    styles["H3"] = ParagraphStyle(
        "ReportH3",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True,
    )
    styles["Body"] = ParagraphStyle(
        "ReportBody",
        fontName="Helvetica",
        fontSize=8.8,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=5,
    )
    styles["Bullet"] = ParagraphStyle(
        "ReportBullet",
        fontName="Helvetica",
        fontSize=8.8,
        leading=12.5,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=14,
        firstLineIndent=-9,
        spaceAfter=2.5,
    )
    styles["CalloutTitle"] = ParagraphStyle(
        "CalloutTitle",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11.5,
        textColor=colors.HexColor("#1E3A8A"),
    )
    styles["CalloutText"] = ParagraphStyle(
        "CalloutText",
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    styles["TableHeader"] = ParagraphStyle(
        "TableHeader",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )
    styles["TableCell"] = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
    )

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("CRITICAL INFRASTRUCTURE &amp; HUMANITARIAN PLATFORM REPORT", styles["CoverBadge"]))
    story.append(Paragraph("BridgeX", styles["CoverTitle"]))
    story.append(Paragraph("Global Multilingual Emergency Response &amp; Crisis Coordination Platform", styles["CoverSubtitle"]))
    
    story.append(HRFlowable(width="100%", thickness=3, color=colors.HexColor("#DC2626"), spaceBefore=0, spaceAfter=25))

    meta_table_data = [
        [Paragraph("Project Name:", styles["CoverMetaLabel"]), Paragraph("BridgeX (Emergency Response Without Borders)", styles["CoverMetaVal"])],
        [Paragraph("Domain / Discipline:", styles["CoverMetaLabel"]), Paragraph("Public Safety, Disaster Management, Real-Time GIS &amp; Localization", styles["CoverMetaVal"])],
        [Paragraph("Architecture Type:", styles["CoverMetaLabel"]), Paragraph("Real-Time Event-Driven Full-Stack Web Architecture", styles["CoverMetaVal"])],
        [Paragraph("Core Innovations:", styles["CoverMetaLabel"]), Paragraph("24+ Multilingual Auto-Triage, One-Tap Panic Mode, Live Leaflet GIS, Supabase CDC Realtime", styles["CoverMetaVal"])],
        [Paragraph("Document Type:", styles["CoverMetaLabel"]), Paragraph("Comprehensive Technical Architecture, Design &amp; Implementation Report", styles["CoverMetaVal"])],
        [Paragraph("Platform Status:", styles["CoverMetaLabel"]), Paragraph("Production Ready / Complete Implementation", styles["CoverMetaVal"])],
    ]
    meta_table = Table(meta_table_data, colWidths=[130, 382])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(meta_table)

    story.append(Spacer(1, 45))
    story.append(create_callout(
        "BridgeX eliminates linguistic and geographical barriers in life-threatening crises. "
        "By fusing instant GPS geolocation, intelligent multilingual auto-categorization across 24+ languages, "
        "and sub-second responder dispatching, BridgeX guarantees that language differences never cost a human life.",
        title="MISSION STATEMENT",
        border_color="#DC2626",
        bg_color="#FEF2F2",
        styles=styles
    ))

    story.append(PageBreak())

    # =========================================================================
    # EXECUTIVE SUMMARY & TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("Executive Summary", styles["H1"]))
    story.append(Paragraph(
        "During critical emergencies -- such as cardiac arrests, traffic collisions, structural fires, or personal security assaults -- "
        "dispatch speed and communication clarity dictate survival outcomes. In multi-lingual nations and global tourist hotspots, "
        "severe language barriers and manual telephone triage often delay first responders by tens of minutes.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "<b>BridgeX</b> solves this systemic bottleneck through a unified, high-resilience web platform. "
        "Victims can initiate an emergency broadcast via voice, text, or a single-tap 5-second Panic button. "
        "The system captures high-accuracy coordinates, automatically classifies the emergency into Medical, Fire, or Security "
        "departments using deep multilingual keyword taxonomy across 12+ Indic and international languages, and instantly dispatches "
        "the alert to certified local responders within an expanding radius.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "Responders track incoming distress signals via interactive OpenStreetMap displays, communicate through bi-directional "
        "real-time chat translated on-the-fly, and access emergency evidence. The platform operates with sub-second event synchronization "
        "via PostgreSQL Change Data Capture (CDC) over WebSockets and maintains high offline resilience with embedded first-aid protocols.",
        styles["Body"]
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Report Structure &amp; Table of Contents", styles["H2"]))
    
    toc_data = [
        ["Chapter 1", "Introduction &amp; Problem Statement", "Background, current emergency dispatch flaws, proposed solution"],
        ["Chapter 2", "Project Objectives", "Primary, functional, and societal humanitarian goals"],
        ["Chapter 3", "Project Scope", "In-scope modules, non-functional criteria, target audience, boundaries"],
        ["Chapter 4", "Technology Stack", "Full-stack specifications: Next.js 16, Supabase, Leaflet, Lingo.dev"],
        ["Chapter 5", "System Architecture &amp; Workflows", "High-level architecture, emergency lifecycle, dispatch routing"],
        ["Chapter 6", "Key Modules &amp; Functional Description", "SOS Interface, Multilingual Classifier, GIS Map, Responder Portal, Chat"],
        ["Chapter 7", "Database Design &amp; Data Models", "Entity-Relationship structure, PostgreSQL schema dictionary"],
        ["Chapter 8", "Security, Privacy &amp; Reliability", "Row-Level Security (RLS), location privacy, fault tolerance"],
        ["Chapter 9", "Engineering Challenges &amp; Solutions", "Latency optimization, Romanised Indic parsing, offline fallback"],
        ["Chapter 10", "Future Enhancements &amp; Conclusion", "Wearables, mesh networks, drone dispatching, summary"],
    ]
    story.append(create_table(["Chapter", "Title", "Core Coverage"], toc_data, [65, 175, 272], styles))

    story.append(Spacer(1, 6))

    # =========================================================================
    # CHAPTER 1: INTRODUCTION
    # =========================================================================
    story.append(Paragraph("Chapter 1: Introduction", styles["H1"]))
    story.append(Paragraph("1.1 Background &amp; Context", styles["H2"]))
    story.append(Paragraph(
        "Emergency dispatch systems across the globe remain largely anchored to legacy telephonic infrastructure (e.g., 911, 112, 100, 108). "
        "While emergency call centers have served societies for decades, the rapid growth of urban migration, global tourism, and digital "
        "connectivity has highlighted critical shortcomings in voice-only, single-language telephone lines.",
        styles["Body"]
    ))
    story.append(Paragraph(
        "When an individual in acute distress dials an emergency line, they are frequently in a state of hyperventilation, disorientation, or physical danger. "
        "If the caller speaks Marathi, Tamil, Bengali, Hindi, French, or Japanese, and the dispatcher speaks only English or a regional dialect, "
        "valuable golden-hour minutes are lost in cross-linguistic confusion or translation transfers.",
        styles["Body"]
    ))

    story.append(Paragraph("1.2 The Problem Statement", styles["H2"]))
    story.append(Paragraph("Modern crisis response workflows suffer from four fatal vulnerabilities:", styles["Body"]))
    story.append(Paragraph("- <b>Linguistic Miscommunication:</b> In multilingual environments, dispatch operators frequently misunderstand victim descriptions, leading to incorrect department dispatches or tragic delays.", styles["Bullet"]))
    story.append(Paragraph("- <b>Geospatial Ambiguity:</b> Panicked callers struggle to identify landmarks or street coordinates, forcing responders to search blindly across neighborhoods.", styles["Bullet"]))
    story.append(Paragraph("- <b>Unidirectional Flow:</b> Victims are left without visual confirmation of responder dispatch, ETA, or real-time location tracking.", styles["Bullet"]))
    story.append(Paragraph("- <b>Siloed Tools:</b> First aid tutorials, nearby hospital listings, emergency contacts, and live dispatch remain fragmented across different applications.", styles["Bullet"]))

    story.append(Paragraph("1.3 Proposed Solution: BridgeX", styles["H2"]))
    story.append(Paragraph(
        "<b>BridgeX</b> is engineered as a responsive, real-time crisis coordination ecosystem. It combines client-side Web Speech recognition, "
        "zero-latency emergency dictionaries, the Lingo.dev localization engine, Leaflet-based OpenStreetMap mapping, and Supabase real-time WebSockets. "
        "The system standardizes every emergency signal into high-precision coordinates and translated English text for dispatchers, "
        "while allowing victims to interact in their native tongue.",
        styles["Body"]
    ))

    # =========================================================================
    # CHAPTER 2: PROJECT OBJECTIVES
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 2: Project Objectives", styles["H1"]))
    story.append(Paragraph("2.1 Primary Objective", styles["H2"]))
    story.append(Paragraph(
        "To develop an accessible, real-time emergency response platform that breaks down linguistic and geographic barriers "
        "during life-threatening crises, instantly connecting victims with verified nearby responders.",
        styles["Body"]
    ))

    story.append(Paragraph("2.2 Specific Technical &amp; Functional Objectives", styles["H2"]))
    story.append(Paragraph("- <b>Sub-Second Distress Broadcasting:</b> Implement a one-tap 5-second Panic countdown and multi-format SOS input (text, voice, photo evidence) linked to high-precision GPS.", styles["Bullet"]))
    story.append(Paragraph("- <b>Automated Multilingual Triage:</b> Classify emergencies across 24+ languages into Medical, Fire, and Security departments with confidence scoring.", styles["Bullet"]))
    story.append(Paragraph("- <b>Proximity-Based Dispatch Algorithm:</b> Use the Haversine formula to match incidents with verified responders within active kilometer radii, supporting automated radius expansion for unacknowledged panic alerts.", styles["Bullet"]))
    story.append(Paragraph("- <b>Bi-directional Real-Time Translated Chat:</b> Enable live WebSocket communication where messages are transparently translated between victim and responder.", styles["Bullet"]))
    story.append(Paragraph("- <b>Offline Emergency Toolkit:</b> Provide zero-connectivity tools including acoustic sirens, hardware Morse-code flashlight strobes, and comprehensive first-aid guides.", styles["Bullet"]))

    # =========================================================================
    # CHAPTER 3: PROJECT SCOPE
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 3: Project Scope", styles["H1"]))
    story.append(Paragraph("3.1 Functional Scope", styles["H2"]))
    story.append(Paragraph(
        "The platform encompasses full end-to-end functionality across four primary operational tiers:",
        styles["Body"]
    ))
    
    scope_data = [
        ["Operational Tier", "Included Modules &amp; Capabilities"],
        ["Citizen / Victim Portal", "Voice SOS, text SOS, incident photo attachment, 5-second Panic Mode, live responder ETA tracking, translated two-way chat, safety check-in."],
        ["Responder Center", "On-duty/off-duty toggle, specialization profiles (medical, fire, rescue), live tactical Leaflet map, emergency inbox, alert acceptance/resolution."],
        ["GIS &amp; Resource Discovery", "Automatic GPS capture, street address reverse-geocoding, Overpass API search for nearby hospitals, clinics, and police stations."],
        ["Analytics &amp; Admin", "Real-time metrics, incident frequency charts, average response latency tracking, geographic heatmaps, database integrity testing."],
    ]
    story.append(create_table(scope_data[0], scope_data[1:], [130, 374], styles))

    story.append(Paragraph("3.2 Non-Functional Scope &amp; Target Beneficiaries", styles["H2"]))
    story.append(Paragraph("- <b>Latency:</b> Translation responses under 5ms via multi-tier caching; real-time event distribution under 500ms via WebSockets.", styles["Bullet"]))
    story.append(Paragraph("- <b>Security:</b> Strict database Row-Level Security (RLS) guaranteeing data segregation between anonymous users, victims, and responders.", styles["Bullet"]))
    story.append(Paragraph("- <b>Accessibility:</b> Mobile-first layout with high-contrast emergency themes, large touch targets, screen-reader compliance, and Right-to-Left (RTL) layout switching.", styles["Bullet"]))
    story.append(Paragraph("- <b>Target Beneficiaries:</b> General public, multilingual citizens, foreign tourists, first responder volunteers, and civil defense organizations.", styles["Bullet"]))

    # =========================================================================
    # CHAPTER 4: TECHNOLOGY STACK
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 4: Technology Stack", styles["H1"]))
    story.append(Paragraph(
        "BridgeX is built on an enterprise-grade, modern open-source web stack designed for rapid execution and horizontal scalability:",
        styles["Body"]
    ))

    tech_data = [
        ["Architectural Layer", "Technologies Selected", "Rationale &amp; Engineering Role"],
        ["Frontend Core", "Next.js 16, React 19, TypeScript", "App router architecture, server-side rendering for speed, strict type-safety across critical data models."],
        ["Styling &amp; UX", "Tailwind CSS, Radix UI Primitives, Lucide", "Design system with accessible, unstyled interactive primitives; high-contrast themes and responsive styling."],
        ["Animations", "Framer Motion, Sonner Toaster", "Visual countdowns for panic mode, pulsing beacon markers, fluid user transitions under stressful usage."],
        ["Database &amp; Realtime", "Supabase PostgreSQL, Supabase Realtime (CDC)", "PostgreSQL database with Row-Level Security; WebSockets streaming live alert updates from write-ahead logs."],
        ["GIS &amp; Mapping", "Leaflet, React-Leaflet, OpenStreetMap", "Lightweight open-source mapping; avoids vendor lock-in; coordinates geocoded via OSM Nominatim and Overpass API."],
        ["Localization &amp; NLP", "Lingo.dev SDK, Custom Indic Script Engine", "Automated internationalization pipeline across 24+ locales; phonetic transliteration of Romanised Indic speech."],
        ["Hardware &amp; Web APIs", "Web Speech API, Web Push (VAPID), Geolocation", "Browser-native voice-to-text dictation; background push alerts to responders; high-precision GPS positioning."],
        ["Analytics &amp; Forms", "Recharts, React Hook Form, Zod", "Data visualization for dispatch times and alert volumes; schema validation for emergency dispatch payloads."],
    ]
    story.append(create_table(tech_data[0], tech_data[1:], [105, 145, 262], styles))

    # =========================================================================
    # CHAPTER 5: SYSTEM ARCHITECTURE & WORKFLOWS
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 5: System Architecture &amp; Workflows", styles["H1"]))
    story.append(Paragraph("5.1 End-to-End Emergency Lifecycle Workflow", styles["H2"]))
    story.append(Paragraph(
        "The complete operational lifecycle from distress trigger to incident resolution progresses through seven structured phases:",
        styles["Body"]
    ))

    workflow_data = [
        ["Phase", "Action", "Technical Mechanism"],
        ["1. Trigger", "Victim initiates SOS via text, voice, or 5s Panic button.", "W3C Geolocation API captures latitude, longitude, and accuracy."],
        ["2. Triage", "System parses message text and determines category.", "Emergency Classifier evaluates 12+ language dictionaries (Medical/Fire/Security)."],
        ["3. Translation", "Message translated to standardized English for dispatchers.", "Lingo.dev engine and offline dictionary parse original dialect."],
        ["4. Ingestion", "Alert record written to PostgreSQL 'alerts' table.", "Supabase client inserts validated payload with RLS verification."],
        ["5. Dispatch", "Nearest verified responders calculated and notified.", "Haversine distance calculation in dispatch engine; Web Push notification fired."],
        ["6. Response", "Responder claims alert and navigates to scene.", "Status shifts to 'responding'; live GPS coordinates stream over WebSockets."],
        ["7. Resolution", "Incident concluded on-site by responder.", "Status set to 'resolved'; timestamp recorded for response analytics."],
    ]
    story.append(create_table(workflow_data[0], workflow_data[1:], [60, 182, 270], styles))

    story.append(Paragraph("5.2 Geospatial Dispatch &amp; Panic Escalation", styles["H2"]))
    story.append(Paragraph(
        "The dispatch module (<code>lib/dispatch.ts</code>) executes a proximity search against all active, verified responders. "
        "Using the Haversine formula, Euclidean surface distances are calculated in kilometers. "
        "Standard alerts notify responders whose specialization directly matches the emergency category (e.g., paramedics for medical incidents). "
        "However, if an alert is triggered in <b>Panic Mode</b>, the system initiates panic escalation: the search radius is automatically tripled, "
        "and alerts are broadcast to all responders regardless of specialization to ensure immediate physical intervention.",
        styles["Body"]
    ))

    # =========================================================================
    # CHAPTER 6: KEY MODULES & FUNCTIONAL DESCRIPTION
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 6: Key Modules &amp; Functional Description", styles["H1"]))
    
    story.append(Paragraph("6.1 SOS Emergency Interface &amp; Panic Mode", styles["H2"]))
    story.append(Paragraph(
        "The primary emergency screen (<code>components/sos-interface-v2.tsx</code>) provides quick-select category cards "
        "(Medical, Fire, Police, Other), dynamic severity selectors (Low, Medium, High, Critical), voice dictation, and photo uploads. "
        "The one-tap Panic Mode initiates a visual circular progress countdown with distinct warning audio. "
        "Users have 5 seconds to cancel accidental activations before an urgent broadcast is transmitted.",
        styles["Body"]
    ))

    story.append(Paragraph("6.2 Multilingual Emergency Classifier &amp; Auto-Routing", styles["H2"]))
    story.append(Paragraph(
        "The classifier (<code>lib/emergency-classifier.ts</code>) inspects distress text across 12+ languages. "
        "It features comprehensive lexicons for Marathi, Hindi, Bengali, Tamil, Telugu, Gujarati, and English. "
        "It outputs a confidence score, the appropriate department tag, and displays national helpline shortcuts (108, 101, 100, 112).",
        styles["Body"]
    ))

    story.append(Paragraph("6.3 Multi-Tiered Translation Pipeline", styles["H2"]))
    story.append(Paragraph(
        "To guarantee translation availability even under poor network conditions, the platform implements a 3-tier cascade: "
        "<b>Tier 1:</b> In-memory offline emergency dictionary resolving primary distress words in &lt;1ms. "
        "<b>Tier 2:</b> Lingo.dev SDK localization engine with a strict 5-second timeout. "
        "<b>Tier 3:</b> MyMemory international REST API fallback. "
        "Additionally, phonetic transliteration converts Latinized native text (e.g., <i>'bachao'</i> to native Indic scripts).",
        styles["Body"]
    ))

    story.append(Paragraph("6.4 Interactive GIS Live Map &amp; Nearby Resources", styles["H2"]))
    story.append(Paragraph(
        "The live map module (<code>components/map-view.tsx</code>) renders active emergencies using Leaflet markers. "
        "Pulsing red beacons represent critical incidents, while moving directional markers track responders. "
        "An integrated Overpass API query displays nearby hospitals, trauma centers, and police stations with one-touch calling and driving directions.",
        styles["Body"]
    ))

    story.append(Paragraph("6.5 Real-Time Bi-Directional Translated Chat", styles["H2"]))
    story.append(Paragraph(
        "Once a responder accepts an alert, a dedicated chat channel opens over Supabase Realtime. "
        "The victim types in their native language (e.g., Hindi), and the responder receives the message in their configured locale (e.g., English), "
        "with the original text preserved. Pre-built quick-reply chips facilitate rapid status updates.",
        styles["Body"]
    ))

    story.append(Paragraph("6.6 Offline Survival Toolkit &amp; First-Aid Guides", styles["H2"]))
    story.append(Paragraph(
        "The platform includes an offline-capable First-Aid Guide (<code>components/first-aid-guide.tsx</code>) covering CPR, "
        "severe bleeding, burns, fractures, and choking. The Emergency Beacon utilizes the Web Audio API to emit high-decibel acoustic "
        "distress frequencies and the MediaStream Image Capture API to strobe the device's camera flash in Morse code SOS.",
        styles["Body"]
    ))

    # =========================================================================
    # CHAPTER 7: DATABASE DESIGN & DATA MODELS
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 7: Database Design &amp; Schema Architecture", styles["H1"]))
    story.append(Paragraph(
        "The database is architected on PostgreSQL via Supabase, with relational integrity and strict Row-Level Security (RLS):",
        styles["Body"]
    ))

    db_data = [
        ["Table Name", "Primary Key", "Foreign Keys", "Key Fields &amp; Description"],
        ["profiles", "id (UUID)", "auth.users(id)", "email, role ('user'|'responder'|'admin'), verified (bool), languages (text[])."],
        ["alerts", "id (UUID)", "profiles(id)", "emergency_type, urgency_level, message (translated), original_message, location (JSONB), status, panic_mode, responders (UUID[])."],
        ["responders", "id (UUID)", "profiles(id)", "verification_status ('pending'|'verified'), specializations (text[]), response_radius (int km), active (bool)."],
        ["responder_locations", "id (UUID)", "responders(id)", "latitude, longitude, accuracy, status ('available'|'responding'|'offline'), last_updated."],
        ["chat_messages", "id (UUID)", "alerts(id), profiles(id)", "content, translated_content (JSONB), sender_type, created_at."],
        ["notifications", "id (UUID)", "profiles(id), alerts(id)", "title, body, read (bool), type, priority ('low'|'normal'|'high'|'urgent')."],
        ["push_subscriptions", "id (UUID)", "profiles(id)", "subscription (JSONB endpoint/keys), endpoint (generated text)."],
    ]
    story.append(create_table(db_data[0], db_data[1:], [80, 65, 85, 282], styles))

    # =========================================================================
    # CHAPTER 8: SECURITY, PRIVACY & RELIABILITY
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 8: Security, Privacy &amp; Reliability", styles["H1"]))
    story.append(Paragraph("8.1 Row-Level Security (RLS) Architecture", styles["H2"]))
    story.append(Paragraph(
        "Data security is enforced directly at the PostgreSQL layer. Unauthenticated users cannot read private user records. "
        "Victims can only access their own alerts and linked chats. Certified responders are permitted to inspect open alerts within their "
        "operational perimeter, while administrative operations require verified admin claims.",
        styles["Body"]
    ))

    story.append(Paragraph("8.2 Privacy &amp; Ephemeral Geolocation", styles["H2"]))
    story.append(Paragraph(
        "GPS coordinates are captured only upon explicit user distress triggering. "
        "Responder location tracking is restricted to active duty windows and ceases immediately upon setting the status to offline.",
        styles["Body"]
    ))

    # =========================================================================
    # CHAPTER 9: ENGINEERING CHALLENGES & SOLUTIONS
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("Chapter 9: Engineering Challenges &amp; Technical Solutions", styles["H1"]))
    
    challenges_data = [
        ["Engineering Challenge", "Technical Root Cause", "Architecture Solution Implemented"],
        ["Translation Latency Overhead", "Remote translation APIs introduce 500ms-1500ms network round-trips during critical moments.", "Constructed local memory and localStorage caches (<5ms), backed by a local dictionary (<1ms) and 5s timeout failover."],
        ["Phonetic / Romanised Native Input", "Users type native languages in Latin script (e.g., 'madad chahiye' instead of Devanagari).", "Engineered custom phonetic transliteration heuristics converting romanised text to native unicode before classification."],
        ["Fluctuating Field Connectivity", "Emergencies often occur in basements or remote areas with degraded cellular reception.", "Integrated PWA caching for offline first-aid guides, Web Audio siren generation, and local alert persistence."],
        ["Geographic Landmark Confusion", "Panicked callers cannot describe cross streets or accurate neighborhood addresses.", "Automated browser GPS coordinates collection paired with real-time reverse geocoding via OpenStreetMap Nominatim."],
        ["Cross-Browser Speech Support", "Different browsers implement Web Speech recognition locales inconsistently.", "Built an adaptive locale mapping engine binding speech recognition directly to user-selected interface languages."],
    ]
    story.append(create_table(challenges_data[0], challenges_data[1:], [105, 145, 262], styles))

    # =========================================================================
    # CHAPTER 10: FUTURE ENHANCEMENTS & CONCLUSION
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chapter 10: Future Enhancements &amp; Conclusion", styles["H1"]))
    
    story.append(Paragraph("10.1 Future Scope &amp; Roadmap", styles["H2"]))
    story.append(Paragraph("- <b>IoT &amp; Wearable Distress Triggers:</b> Direct integration with BLE panic buttons, smartwatches, and automotive impact sensors for automatic collision dispatches.", styles["Bullet"]))
    story.append(Paragraph("- <b>Peer-to-Peer Mesh Networking:</b> Implementation of WebRTC mesh protocols allowing devices to relay distress signals from phone to phone when cellular towers collapse during natural disasters.", styles["Bullet"]))
    story.append(Paragraph("- <b>Automated Telephony Bridges:</b> Integration with Twilio or GSM gateways to automatically bridge web dispatches into voice phone calls to local 100/108 control rooms.", styles["Bullet"]))
    story.append(Paragraph("- <b>Autonomous AED &amp; Drone Dispatch:</b> Automated coordination with unmanned aerial vehicles (UAVs) to deliver defibrillators and trauma kits directly to GPS coordinates.", styles["Bullet"]))

    story.append(Paragraph("10.2 Conclusion", styles["H2"]))
    story.append(Paragraph(
        "<b>BridgeX</b> demonstrates how modern web engineering, real-time event streaming, and intelligent localization can "
        "transform humanitarian emergency response. By dismantling the language barrier and eliminating geographic ambiguity, "
        "BridgeX establishes a scalable, production-ready foundation that empowers citizens, supports first responders, "
        "and ensures that help is never lost in translation.",
        styles["Body"]
    ))

    story.append(Spacer(1, 6))
    story.append(create_callout(
        "Report Compiled Successfully - Platform Status: Production Ready - "
        "BridgeX Core Architecture (c) 2026",
        title="END OF REPORT",
        border_color="#0F172A",
        bg_color="#F1F5F9",
        styles=styles
    ))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename} (Size: {os.path.getsize(filename)} bytes)")


if __name__ == "__main__":
    output_filename = "BridgeX_Project_Report.pdf"
    if len(sys.argv) > 1:
        output_filename = sys.argv[1]
    build_pdf(output_filename)
