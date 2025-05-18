Product Requirements Document: Network Traffic Generator
1. Executive Summary
The Network Traffic Generator is a standalone tool designed to generate configurable network traffic patterns for testing Network Performance Monitoring (NPM) tools. It features a web-based UI for easy configuration and real-time monitoring of traffic generation, with the ability to be deployed flexibly in containers or directly on network devices/VMs.
2. Product Overview
2.1 Problem Statement
Testing NPM tools requires consistent, predictable, and configurable network traffic patterns. Existing solutions like iperf often lack easy configuration options for complex patterns such as bell curves, and may require extensive setup on both clients and servers.
2.2 Solution
A web-configurable traffic generator that:

Creates actual network packets visible to SNMP monitoring
Supports multiple traffic pattern profiles
Deploys easily in containers or directly on devices
Provides real-time visualization and metrics
Operates with minimal dependencies

3. User Experience & Functionality
3.1 Core Features
Traffic Generation

Generate UDP traffic with configurable bandwidth (up to hardware/network limits)
Support multiple traffic pattern profiles:

Bell curve (normal distribution)
Constant rate
Random fluctuations


Configure duration of traffic generation (seconds)
Set target IP address and port
Define packet size

Web Interface

Simple, intuitive configuration panel
Real-time traffic visualization (bandwidth graph)
Live metrics display:

Current bandwidth
Total data sent
Elapsed time
Generation status


Start/Stop controls

Deployment & Operation

Standalone operation (no external dependencies)
Container-ready design
Cross-platform compatibility

3.2 User Workflows

Configuration

Access web UI
Set traffic pattern parameters
Configure target destination
Apply settings


Traffic Generation

Start traffic generation
Monitor real-time metrics and graph
Stop manually or allow automatic completion


NPM Tool Testing

Deploy traffic generator in network path monitored by NPM
Configure desired traffic pattern
Compare NPM metrics with generator metrics



4. Technical Requirements
4.1 Architecture

Backend: Go-based traffic generation engine
Frontend: React-based web UI
Communication: RESTful API and WebSockets
Packaging: Docker container and standalone binary options

4.2 Performance Requirements

Support traffic generation up to 10 Gbps (hardware/network permitting)
Minimal CPU/memory footprint
Accurate bandwidth control (±5% of target)
Support for various packet sizes (64-9000 bytes)

4.3 Security & Compliance

No privileged operations required
Configurable target restrictions to prevent misuse
No external API dependencies
Basic authentication for production deployments

5. Implementation Plan
5.1 Phase 1: Core Functionality

Implement basic traffic generation engine
Create simple web UI
Support bell curve and constant patterns
Basic metrics collection

5.2 Phase 2: Enhanced Features

Add random pattern support
Implement real-time visualization
Add WebSocket communication
Improve metrics accuracy

5.3 Phase 3: Deployment & Testing

Containerization
Cross-platform testing
Performance optimization
Documentation

6. Testing Strategy
6.1 Functional Testing

Verify traffic patterns match theoretical models
Ensure bandwidth control accuracy
Test UI functionality across browsers

6.2 Performance Testing

Measure maximum achievable bandwidth
Test resource utilization
Validate long-running stability

6.3 Integration Testing

Verify visibility in common NPM tools
Test in various network configurations
Validate container deployment in different environments

7. Success Metrics

Successfully generate visible traffic through SNMP-monitored interfaces
Match configured traffic patterns with >95% accuracy
Deploy and operate without dependencies on client or server
Support all common network configurations
Provide accurate real-time metrics matching actual traffic generated

8. Future Considerations

TCP traffic support
Additional traffic patterns (sawtooth, step functions)
Multi-target support
Traffic replay from captured samples
Additional metrics (jitter, packet loss simulation)
API for programmatic control
Cluster mode for distributed load generation

9. Dependencies & Constraints

Go 1.16+ for development
Docker for containerized deployment
Network access rights for traffic generation
UDP port accessibility on target systems

10. Acceptance Criteria
The Network Traffic Generator will be considered complete when it can:

Generate traffic following bell curve, constant, and random patterns
Provide a web UI for configuration and monitoring
Display real-time metrics and visualizations
Deploy in both containerized and standalone modes
Successfully test NPM tools by generating traffic visible to SNMP monitoring

11. Timeline

Phase 1: 2 weeks
Phase 2: 2 weeks
Phase 3: 1 week
Testing & Documentation: 1 week

Total estimated development time: 6 weeks
