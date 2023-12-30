export default {
	async fetch(request, env, ctx) {
		const userIP = request.headers.get('x-real-ip');
		const requestPath = new URL(request.url).pathname;

		if(requestPath === '/') {
			return new Response(userIP)
		} else if(requestPath.includes('/http-knock')) {
			try {
				const portsToKnock = requestPath.split('/http-knock/')[1].split(',').map(port => parseInt(port)).filter(port => !isNaN(port));
				if(portsToKnock.length === 0) {
					const data = {
						error: 'No ports specified to check'
					};			  
					return new Response(JSON.stringify(data), {
						headers: { 'content-type': 'application/json' },
					})
				}
	
				const portKnock = await Promise.all(portsToKnock.map(async port => {
					const scheme = (port === 443) ? 'https' : 'http'
					const path = (port === 443) ? '/ping' : '/insecure/ping'
					const host = (userIP.includes(':')) ? (userIP.replaceAll(':', '-') + ".backname.difusedns.com") : (userIP + ".backname.difusedns.com")
					const response = await fetch(`${scheme}://${host}:${port}${path}`, { method: 'GET' })
					const responseText = await response.text()
					let isOpen = response.ok

					if(responseText.includes('error code: 526')) {
						isOpen = true
					}

					return {
						port,
						open: isOpen,
						ip: userIP,
					}
				}))
	
				const data = {
					checks: portKnock
				};

				return new Response(JSON.stringify(data), {
					headers: { 'content-type': 'application/json' },
				})
			} catch (error) {
				const data = {
					error: 'Error checking ports'
				};			  
				return new Response(JSON.stringify(data), {
					headers: { 'content-type': 'application/json' },
				})
			}
		} else {
			return new Response('404')
		}
	},
};